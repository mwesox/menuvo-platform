/**
 * Order Router
 *
 * Handles order-related procedures:
 * - Order creation (customer checkout)
 * - Order retrieval (for tracking)
 * - Order management (store owner)
 * - Order statistics and export
 * - Refunds (Mollie)
 */

import {
	items,
	optionChoices,
	optionGroups,
	orderItemOptions,
	orderItems,
	orders,
	servicePoints,
	stores,
} from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gte, inArray, lte, sum } from "drizzle-orm";
import {
	cancelOrderSchema,
	createOrderSchema,
	createRefundSchema,
	getOrderByIdSchema,
	getOrderStatsSchema,
	getOrdersForExportSchema,
	listOrdersSchema,
	updateOrderStatusSchema,
} from "../schemas/order.schema.js";
import { publicProcedure, router, storeOwnerProcedure } from "../trpc.js";

export const orderRouter = router({
	// ============================================================================
	// PUBLIC PROCEDURES (Customer-facing)
	// ============================================================================

	/**
	 * Create a new order (public - for customers)
	 * This is the main checkout procedure called by the shop.
	 */
	create: publicProcedure
		.input(createOrderSchema)
		.mutation(async ({ ctx, input }) => {
			// 1. Verify store exists and is active
			const store = await ctx.db.query.stores.findFirst({
				where: and(eq(stores.id, input.storeId), eq(stores.isActive, true)),
				columns: { id: true, merchantId: true, currency: true },
			});

			if (!store) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found or is not active",
				});
			}

			// 2. If service point is provided, verify it exists and belongs to the store
			if (input.servicePointId) {
				const servicePoint = await ctx.db.query.servicePoints.findFirst({
					where: and(
						eq(servicePoints.id, input.servicePointId),
						eq(servicePoints.storeId, input.storeId),
						eq(servicePoints.isActive, true),
					),
					columns: { id: true },
				});

				if (!servicePoint) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Service point not found or is not active",
					});
				}
			}

			// 3. Fetch all items and calculate prices
			const itemIds = input.items.map((i) => i.itemId);
			const dbItems = await ctx.db.query.items.findMany({
				where: and(
					inArray(items.id, itemIds),
					eq(items.storeId, input.storeId),
					eq(items.isAvailable, true),
				),
				columns: {
					id: true,
					price: true,
					kitchenName: true,
					translations: true,
				},
			});

			// Verify all items exist
			const dbItemMap = new Map(dbItems.map((item) => [item.id, item]));
			for (const inputItem of input.items) {
				if (!dbItemMap.has(inputItem.itemId)) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: `Item ${inputItem.itemId} not found, not available, or doesn't belong to this store`,
					});
				}
			}

			// 4. Collect all option choice IDs and fetch them
			const allOptionChoiceIds: string[] = [];
			for (const inputItem of input.items) {
				if (inputItem.options) {
					for (const opt of inputItem.options) {
						allOptionChoiceIds.push(opt.optionChoiceId);
					}
				}
			}

			let choiceMap = new Map<
				string,
				{
					id: string;
					priceModifier: number;
					translations: { de?: { name?: string }; en?: { name?: string } };
					optionGroupId: string;
				}
			>();
			let groupMap = new Map<
				string,
				{
					id: string;
					translations: { de?: { name?: string }; en?: { name?: string } };
				}
			>();

			if (allOptionChoiceIds.length > 0) {
				const dbChoices = await ctx.db.query.optionChoices.findMany({
					where: inArray(optionChoices.id, allOptionChoiceIds),
					columns: {
						id: true,
						priceModifier: true,
						translations: true,
						optionGroupId: true,
					},
				});
				choiceMap = new Map(dbChoices.map((c) => [c.id, c]));

				// Fetch all referenced option groups
				const groupIds = [...new Set(dbChoices.map((c) => c.optionGroupId))];
				if (groupIds.length > 0) {
					const dbGroups = await ctx.db.query.optionGroups.findMany({
						where: inArray(optionGroups.id, groupIds),
						columns: { id: true, translations: true },
					});
					groupMap = new Map(dbGroups.map((g) => [g.id, g]));
				}
			}

			// 5. Calculate totals and prepare order items
			let subtotal = 0;
			const orderItemsData: Array<{
				name: string;
				kitchenName: string | null;
				description: string | null;
				quantity: number;
				unitPrice: number;
				optionsPrice: number;
				totalPrice: number;
				displayOrder: number;
				itemId: string;
				specialInstructions?: string;
				options?: Array<{
					optionGroupId: string;
					optionChoiceId: string;
					groupName: string;
					choiceName: string;
					quantity: number;
					priceModifier: number;
				}>;
			}> = [];

			for (let i = 0; i < input.items.length; i++) {
				const inputItem = input.items[i];
				if (!inputItem) continue;

				const dbItem = dbItemMap.get(inputItem.itemId);
				if (!dbItem) continue;

				const itemName =
					(dbItem.translations as { de?: { name?: string } })?.de?.name ||
					"Unknown Item";
				const unitPrice = dbItem.price;

				// Calculate options price
				let optionsPrice = 0;
				const itemOptions: Array<{
					optionGroupId: string;
					optionChoiceId: string;
					groupName: string;
					choiceName: string;
					quantity: number;
					priceModifier: number;
				}> = [];

				if (inputItem.options) {
					for (const opt of inputItem.options) {
						const choice = choiceMap.get(opt.optionChoiceId);
						if (!choice) {
							throw new TRPCError({
								code: "NOT_FOUND",
								message: `Option choice ${opt.optionChoiceId} not found`,
							});
						}

						const group = groupMap.get(choice.optionGroupId);
						const groupName =
							(group?.translations as { de?: { name?: string } })?.de?.name ||
							"Unknown Group";
						const choiceName =
							(choice.translations as { de?: { name?: string } })?.de?.name ||
							"Unknown Choice";

						optionsPrice += choice.priceModifier * (opt.quantity || 1);

						itemOptions.push({
							optionGroupId: choice.optionGroupId,
							optionChoiceId: choice.id,
							groupName,
							choiceName,
							quantity: opt.quantity || 1,
							priceModifier: choice.priceModifier,
						});
					}
				}

				const totalPrice =
					(unitPrice + optionsPrice) * (inputItem.quantity || 1);
				subtotal += totalPrice;

				orderItemsData.push({
					name: itemName,
					kitchenName: dbItem.kitchenName ?? null,
					description: null,
					quantity: inputItem.quantity || 1,
					unitPrice,
					optionsPrice,
					totalPrice,
					displayOrder: i,
					itemId: inputItem.itemId,
					specialInstructions: inputItem.specialInstructions,
					options: itemOptions,
				});
			}

			// 6. Create the order in a transaction
			const result = await ctx.db.transaction(async (tx) => {
				// Create the order
				const [newOrder] = await tx
					.insert(orders)
					.values({
						storeId: input.storeId,
						servicePointId: input.servicePointId ?? null,
						orderType: input.orderType,
						status: "awaiting_payment",
						paymentStatus: "pending",
						customerName: input.customerName ?? null,
						customerEmail: input.customerEmail ?? null,
						customerPhone: input.customerPhone ?? null,
						customerNotes: input.customerNotes ?? null,
						subtotal,
						taxAmount: 0,
						tipAmount: 0,
						totalAmount: subtotal,
					})
					.returning();

				if (!newOrder) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create order",
					});
				}

				// Create order items
				for (const itemData of orderItemsData) {
					const [newOrderItem] = await tx
						.insert(orderItems)
						.values({
							orderId: newOrder.id,
							itemId: itemData.itemId,
							name: itemData.name,
							kitchenName: itemData.kitchenName,
							description: itemData.description,
							quantity: itemData.quantity,
							unitPrice: itemData.unitPrice,
							optionsPrice: itemData.optionsPrice,
							totalPrice: itemData.totalPrice,
							displayOrder: itemData.displayOrder,
						})
						.returning();

					if (!newOrderItem) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to create order item",
						});
					}

					// Create order item options
					if (itemData.options && itemData.options.length > 0) {
						await tx.insert(orderItemOptions).values(
							itemData.options.map((opt) => ({
								orderItemId: newOrderItem.id,
								optionGroupId: opt.optionGroupId,
								optionChoiceId: opt.optionChoiceId,
								groupName: opt.groupName,
								choiceName: opt.choiceName,
								quantity: opt.quantity,
								priceModifier: opt.priceModifier,
							})),
						);
					}
				}

				return newOrder;
			});

			return result;
		}),

	/**
	 * Get order by ID (public - for order tracking)
	 */
	getById: publicProcedure
		.input(getOrderByIdSchema)
		.query(async ({ ctx, input }) => {
			const order = await ctx.db.query.orders.findFirst({
				where: eq(orders.id, input.orderId),
				with: {
					store: {
						columns: { id: true, name: true, slug: true, currency: true },
					},
					servicePoint: {
						columns: { id: true, name: true, code: true },
					},
					items: {
						with: {
							options: true,
						},
						orderBy: [asc(orderItems.displayOrder)],
					},
				},
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			return order;
		}),

	/**
	 * Get order by order ID (alias for tracking)
	 * Same as getById but named more explicitly for tracking pages
	 */
	getByOrderId: publicProcedure
		.input(getOrderByIdSchema)
		.query(async ({ ctx, input }) => {
			const order = await ctx.db.query.orders.findFirst({
				where: eq(orders.id, input.orderId),
				with: {
					store: {
						columns: { id: true, name: true, slug: true, currency: true },
					},
					servicePoint: {
						columns: { id: true, name: true, code: true },
					},
					items: {
						with: {
							options: true,
						},
						orderBy: [asc(orderItems.displayOrder)],
					},
				},
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			return order;
		}),

	// ============================================================================
	// STORE OWNER PROCEDURES
	// ============================================================================

	/**
	 * List orders for a store (store owner only)
	 * Supports filtering by status, date range, and pagination
	 */
	listByStore: storeOwnerProcedure
		.input(listOrdersSchema)
		.query(async ({ ctx, input }) => {
			// Verify the store belongs to the authenticated user
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, input.storeId),
					eq(stores.id, ctx.storeId), // Must match user's store
				),
				columns: { id: true },
			});

			if (!store) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this store",
				});
			}

			// Build where conditions
			const conditions = [eq(orders.storeId, input.storeId)];

			if (input.status) {
				conditions.push(eq(orders.status, input.status));
			}

			if (input.paymentStatus) {
				conditions.push(eq(orders.paymentStatus, input.paymentStatus));
			}

			if (input.orderType) {
				conditions.push(eq(orders.orderType, input.orderType));
			}

			if (input.startDate) {
				conditions.push(gte(orders.createdAt, input.startDate));
			}

			if (input.endDate) {
				conditions.push(lte(orders.createdAt, input.endDate));
			}

			// Add cursor condition if provided
			if (input.cursor) {
				conditions.push(lte(orders.id, input.cursor));
			}

			const storeOrders = await ctx.db.query.orders.findMany({
				where: and(...conditions),
				orderBy: [desc(orders.createdAt)],
				limit: input.limit + 1, // Fetch one extra to determine if there's more
				with: {
					servicePoint: {
						columns: { id: true, name: true, code: true },
					},
					items: {
						columns: {
							id: true,
							name: true,
							quantity: true,
							totalPrice: true,
						},
						orderBy: [asc(orderItems.displayOrder)],
					},
				},
			});

			// Determine if there are more results
			const hasMore = storeOrders.length > input.limit;
			const ordersToReturn = hasMore
				? storeOrders.slice(0, input.limit)
				: storeOrders;
			const nextCursor = hasMore
				? ordersToReturn[ordersToReturn.length - 1]?.id
				: null;

			return {
				orders: ordersToReturn,
				nextCursor,
			};
		}),

	/**
	 * Update order status (store owner only)
	 */
	updateStatus: storeOwnerProcedure
		.input(updateOrderStatusSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the order belongs to the user's store
			const order = await ctx.db.query.orders.findFirst({
				where: eq(orders.id, input.orderId),
				columns: { id: true, storeId: true, status: true },
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			if (order.storeId !== ctx.storeId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this order",
				});
			}

			// Update the order status
			const updateData: Record<string, unknown> = {
				status: input.status,
			};

			// Set timestamps based on status
			if (input.status === "confirmed" && order.status === "awaiting_payment") {
				updateData.confirmedAt = new Date();
			} else if (input.status === "completed") {
				updateData.completedAt = new Date();
			}

			const [updatedOrder] = await ctx.db
				.update(orders)
				.set(updateData)
				.where(eq(orders.id, input.orderId))
				.returning();

			if (!updatedOrder) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update order status",
				});
			}

			return updatedOrder;
		}),

	/**
	 * Cancel an order (store owner only)
	 */
	cancel: storeOwnerProcedure
		.input(cancelOrderSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the order belongs to the user's store
			const order = await ctx.db.query.orders.findFirst({
				where: eq(orders.id, input.orderId),
				columns: {
					id: true,
					storeId: true,
					status: true,
					paymentStatus: true,
				},
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			if (order.storeId !== ctx.storeId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this order",
				});
			}

			// Cannot cancel already completed or cancelled orders
			if (order.status === "completed" || order.status === "cancelled") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Cannot cancel order with status: ${order.status}`,
				});
			}

			const [cancelledOrder] = await ctx.db
				.update(orders)
				.set({
					status: "cancelled",
					merchantNotes: input.reason
						? `Cancellation reason: ${input.reason}`
						: undefined,
				})
				.where(eq(orders.id, input.orderId))
				.returning();

			if (!cancelledOrder) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to cancel order",
				});
			}

			return { success: true, order: cancelledOrder };
		}),

	/**
	 * Get order statistics for a store (store owner only)
	 */
	getStats: storeOwnerProcedure
		.input(getOrderStatsSchema)
		.query(async ({ ctx, input }) => {
			// Verify the store belongs to the authenticated user
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, input.storeId),
					eq(stores.id, ctx.storeId), // Must match user's store
				),
				columns: { id: true },
			});

			if (!store) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this store",
				});
			}

			// Build where conditions
			const conditions = [eq(orders.storeId, input.storeId)];

			if (input.startDate) {
				conditions.push(gte(orders.createdAt, input.startDate));
			}

			if (input.endDate) {
				conditions.push(lte(orders.createdAt, input.endDate));
			}

			// Get total orders and revenue
			const [totals] = await ctx.db
				.select({
					totalOrders: count(),
					totalRevenue: sum(orders.totalAmount),
				})
				.from(orders)
				.where(and(...conditions));

			const totalOrders = totals?.totalOrders ?? 0;
			const totalRevenue = Number(totals?.totalRevenue ?? 0);
			const averageOrderValue =
				totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

			// Get orders grouped by status
			const byStatus = await ctx.db
				.select({
					status: orders.status,
					count: count(),
				})
				.from(orders)
				.where(and(...conditions))
				.groupBy(orders.status);

			const ordersByStatus: Record<string, number> = {};
			for (const row of byStatus) {
				ordersByStatus[row.status] = row.count;
			}

			// Get orders grouped by type
			const byType = await ctx.db
				.select({
					orderType: orders.orderType,
					count: count(),
				})
				.from(orders)
				.where(and(...conditions))
				.groupBy(orders.orderType);

			const ordersByType: Record<string, number> = {};
			for (const row of byType) {
				ordersByType[row.orderType] = row.count;
			}

			return {
				totalOrders,
				totalRevenue,
				averageOrderValue,
				ordersByStatus,
				ordersByType,
			};
		}),

	/**
	 * Get orders for export (store owner only)
	 * Returns orders in a format suitable for CSV export
	 */
	getForExport: storeOwnerProcedure
		.input(getOrdersForExportSchema)
		.query(async ({ ctx, input }) => {
			// Verify the store belongs to the authenticated user
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, input.storeId),
					eq(stores.id, ctx.storeId), // Must match user's store
				),
				columns: { id: true, currency: true },
			});

			if (!store) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this store",
				});
			}

			// Build where conditions
			const conditions = [
				eq(orders.storeId, input.storeId),
				gte(orders.createdAt, input.startDate),
				lte(orders.createdAt, input.endDate),
			];

			if (input.status) {
				conditions.push(eq(orders.status, input.status));
			}

			const exportOrders = await ctx.db.query.orders.findMany({
				where: and(...conditions),
				orderBy: [desc(orders.createdAt)],
				with: {
					servicePoint: {
						columns: { name: true, code: true },
					},
					items: {
						with: {
							options: true,
						},
						orderBy: [asc(orderItems.displayOrder)],
					},
				},
			});

			// Transform for export
			return exportOrders.map((order) => ({
				orderId: order.id,
				createdAt: order.createdAt,
				status: order.status,
				paymentStatus: order.paymentStatus,
				orderType: order.orderType,
				customerName: order.customerName,
				customerEmail: order.customerEmail,
				customerPhone: order.customerPhone,
				servicePoint: order.servicePoint?.name ?? null,
				subtotal: order.subtotal,
				taxAmount: order.taxAmount,
				tipAmount: order.tipAmount,
				totalAmount: order.totalAmount,
				currency: store.currency,
				items: order.items.map((item) => ({
					name: item.name,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					optionsPrice: item.optionsPrice,
					totalPrice: item.totalPrice,
					options: item.options.map((opt) => ({
						groupName: opt.groupName,
						choiceName: opt.choiceName,
						quantity: opt.quantity,
						priceModifier: opt.priceModifier,
					})),
				})),
			}));
		}),

	/**
	 * Create a refund (store owner only)
	 * Initiates a refund through Mollie for the order
	 *
	 * Note: The actual Mollie API call should be made by the API layer.
	 * This procedure validates the request and returns the necessary info.
	 */
	createRefund: storeOwnerProcedure
		.input(createRefundSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the order belongs to the user's store
			const order = await ctx.db.query.orders.findFirst({
				where: eq(orders.id, input.orderId),
				columns: {
					id: true,
					storeId: true,
					status: true,
					paymentStatus: true,
					totalAmount: true,
					molliePaymentId: true,
					stripePaymentIntentId: true,
					orderPaymentProvider: true,
				},
				with: {
					store: {
						columns: { merchantId: true },
					},
				},
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			if (order.storeId !== ctx.storeId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this order",
				});
			}

			// Can only refund paid orders
			if (order.paymentStatus !== "paid") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Cannot refund order with payment status: ${order.paymentStatus}`,
				});
			}

			// Validate refund amount
			const refundAmount = input.amount ?? order.totalAmount;
			if (refundAmount > order.totalAmount) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Refund amount cannot exceed order total",
				});
			}

			// Determine payment provider and return info for API layer
			const paymentProvider = order.orderPaymentProvider ?? "stripe";
			const paymentId =
				paymentProvider === "mollie"
					? order.molliePaymentId
					: order.stripePaymentIntentId;

			if (!paymentId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No payment ID found for this order",
				});
			}

			// Return info for the API layer to create the refund
			// The actual refund is created by the API layer using Mollie/Stripe SDK
			return {
				orderId: order.id,
				merchantId: order.store.merchantId,
				paymentProvider,
				paymentId,
				amount: refundAmount,
				description: input.description ?? "Order refund",
				isPartialRefund: refundAmount < order.totalAmount,
			};
		}),
});
