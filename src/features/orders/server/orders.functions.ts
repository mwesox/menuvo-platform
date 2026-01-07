"use server";

/**
 * Server functions for order management.
 *
 * Handles CRUD operations for orders, order items, and order item options.
 * All prices are in cents (integers).
 */

import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte, ilike, inArray, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { orderItemOptions, orderItems, orders } from "@/db/schema";
import { withAuth } from "@/features/console/auth/server/auth-middleware";
import { requireStoreOwnership } from "@/features/console/auth/server/ownership";
import { DatabaseError, NotFoundError } from "@/lib/errors";
import { ordersLogger } from "@/lib/logger";
import {
	InvalidOrderTransitionError,
	OrderNotCancellableError,
} from "../errors";
import { canTransitionTo, getInitialOrderStatus } from "../logic/order-status";
import {
	addMerchantNotesSchema,
	cancelOrderSchema,
	createOrderSchema,
	getKitchenOrdersSchema,
	getOrderSchema,
	getOrdersByStoreSchema,
	updateOrderStatusSchema,
	updatePaymentStatusSchema,
} from "../schemas";

// ============================================================================
// HELPERS
// ============================================================================

async function requireOrderOwnership(orderId: string, merchantId: string) {
	const order = await db.query.orders.findFirst({
		where: eq(orders.id, orderId),
		with: { store: { columns: { merchantId: true } } },
	});
	if (!order || order.store.merchantId !== merchantId) {
		throw new NotFoundError("Order", orderId);
	}
	return order;
}

async function findOrderWithDetails(orderId: string) {
	const order = await db.query.orders.findFirst({
		where: eq(orders.id, orderId),
		with: {
			items: {
				orderBy: (items, { asc }) => [asc(items.displayOrder)],
				with: {
					options: true,
				},
			},
			store: {
				columns: {
					id: true,
					name: true,
					slug: true,
				},
			},
			servicePoint: true,
		},
	});
	if (!order) {
		throw new NotFoundError("Order", orderId);
	}
	return order;
}

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new order with items and options.
 * Uses a database transaction to ensure atomicity.
 */
export const createOrder = createServerFn({ method: "POST" })
	.inputValidator(createOrderSchema)
	.handler(async ({ data }) => {
		ordersLogger.debug(
			{
				storeId: data.storeId,
				orderType: data.orderType,
				customerName: data.customerName,
				itemCount: data.items.length,
				subtotal: data.subtotal,
				totalAmount: data.totalAmount,
			},
			"Creating order",
		);

		const { orderStatus, paymentStatus } = getInitialOrderStatus();

		try {
			const order = await db.transaction(async (tx) => {
				const [newOrder] = await tx
					.insert(orders)
					.values({
						storeId: data.storeId,
						customerName: data.customerName,
						customerEmail: data.customerEmail || null,
						customerPhone: data.customerPhone,
						orderType: data.orderType,
						status: orderStatus,
						servicePointId: data.servicePointId,
						subtotal: data.subtotal,
						taxAmount: data.taxAmount,
						tipAmount: data.tipAmount,
						totalAmount: data.totalAmount,
						paymentStatus,
						paymentMethod: data.paymentMethod,
						customerNotes: data.customerNotes,
						confirmedAt: orderStatus === "confirmed" ? new Date() : null,
					})
					.returning();

				for (let i = 0; i < data.items.length; i++) {
					const item = data.items[i];
					const [orderItem] = await tx
						.insert(orderItems)
						.values({
							orderId: newOrder.id,
							itemId: item.itemId,
							name: item.name,
							kitchenName: item.kitchenName,
							description: item.description,
							quantity: item.quantity,
							unitPrice: item.unitPrice,
							optionsPrice: item.optionsPrice,
							totalPrice: item.totalPrice,
							displayOrder: i,
						})
						.returning();

					if (item.options.length > 0) {
						await tx.insert(orderItemOptions).values(
							item.options.map((opt) => ({
								orderItemId: orderItem.id,
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

			ordersLogger.info({ orderId: order.id }, "Order created successfully");
			return order;
		} catch (error) {
			ordersLogger.error({ error }, "Order creation failed");
			throw new DatabaseError(
				"createOrder",
				error instanceof Error ? error.message : undefined,
			);
		}
	});

// ============================================================================
// READ
// ============================================================================

/**
 * Get a single order by ID with items and options
 */
export const getOrder = createServerFn({ method: "GET" })
	.inputValidator(getOrderSchema)
	.handler(async ({ data }) => {
		return findOrderWithDetails(data.orderId);
	});

/**
 * Get orders for a store with optional filters
 */
export const getOrdersByStore = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.inputValidator(getOrdersByStoreSchema)
	.handler(async ({ context, data }) => {
		const store = await requireStoreOwnership(
			data.storeId,
			context.auth.merchantId,
		);
		const conditions = [eq(orders.storeId, store.id)];

		if (data.status) {
			conditions.push(eq(orders.status, data.status));
		}
		if (data.paymentStatus) {
			conditions.push(eq(orders.paymentStatus, data.paymentStatus));
		}
		if (data.orderType) {
			conditions.push(eq(orders.orderType, data.orderType));
		}
		if (data.fromDate) {
			conditions.push(gte(orders.createdAt, new Date(data.fromDate)));
		}
		if (data.toDate) {
			conditions.push(lte(orders.createdAt, new Date(data.toDate)));
		}
		if (data.search) {
			const searchTerm = `%${data.search}%`;
			const searchCondition = or(
				ilike(orders.customerName, searchTerm),
				ilike(orders.customerEmail, searchTerm),
				ilike(orders.customerPhone, searchTerm),
			);
			if (searchCondition) {
				conditions.push(searchCondition);
			}
		}

		return db.query.orders.findMany({
			where: and(...conditions),
			orderBy: [desc(orders.createdAt)],
			limit: data.limit,
			offset: data.offset,
			with: {
				items: {
					orderBy: (items, { asc }) => [asc(items.displayOrder)],
					with: {
						options: true,
					},
				},
			},
		});
	});

/**
 * Get orders for kitchen monitor (only paid orders in active states)
 */
export const getKitchenOrders = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.inputValidator(getKitchenOrdersSchema)
	.handler(async ({ context, data }) => {
		const store = await requireStoreOwnership(
			data.storeId,
			context.auth.merchantId,
		);
		return db.query.orders.findMany({
			where: and(
				eq(orders.storeId, store.id),
				inArray(orders.status, ["confirmed", "preparing", "ready"]),
				eq(orders.paymentStatus, "paid"),
			),
			orderBy: [desc(orders.createdAt)],
			with: {
				items: {
					orderBy: (items, { asc }) => [asc(items.displayOrder)],
					with: {
						options: true,
					},
				},
				servicePoint: {
					columns: {
						id: true,
						name: true,
						code: true,
					},
				},
			},
		});
	});

/**
 * Get completed orders for kitchen Done archive (last 2 hours)
 */
export const getKitchenDoneOrders = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.inputValidator(getKitchenOrdersSchema)
	.handler(async ({ context, data }) => {
		const store = await requireStoreOwnership(
			data.storeId,
			context.auth.merchantId,
		);
		const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

		return db.query.orders.findMany({
			where: and(
				eq(orders.storeId, store.id),
				eq(orders.status, "completed"),
				eq(orders.paymentStatus, "paid"),
				gte(orders.completedAt, twoHoursAgo),
			),
			orderBy: [desc(orders.completedAt)],
			with: {
				items: {
					orderBy: (items, { asc }) => [asc(items.displayOrder)],
					with: {
						options: true,
					},
				},
				servicePoint: {
					columns: {
						id: true,
						name: true,
						code: true,
					},
				},
			},
		});
	});

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update order status with transition validation
 */
export const updateOrderStatus = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(updateOrderStatusSchema)
	.handler(async ({ context, data }) => {
		const order = await requireOrderOwnership(
			data.orderId,
			context.auth.merchantId,
		);

		// Validate transition
		if (!canTransitionTo(order.status, data.status)) {
			throw new InvalidOrderTransitionError(order.status, data.status);
		}

		// Update with appropriate timestamps
		const updates: Partial<typeof orders.$inferInsert> = {
			status: data.status,
		};

		if (data.status === "confirmed" && !order.confirmedAt) {
			updates.confirmedAt = new Date();
		}
		if (data.status === "completed") {
			updates.completedAt = new Date();
		}

		const [updated] = await db
			.update(orders)
			.set(updates)
			.where(eq(orders.id, data.orderId))
			.returning();

		return updated;
	});

/**
 * Update payment status (called by webhooks)
 */
export const updatePaymentStatus = createServerFn({ method: "POST" })
	.inputValidator(updatePaymentStatusSchema)
	.handler(async ({ data }) => {
		const updates: Partial<typeof orders.$inferInsert> = {
			paymentStatus: data.paymentStatus,
		};

		if (data.stripeCheckoutSessionId) {
			updates.stripeCheckoutSessionId = data.stripeCheckoutSessionId;
		}
		if (data.stripePaymentIntentId) {
			updates.stripePaymentIntentId = data.stripePaymentIntentId;
		}

		// If payment confirmed, also update order status
		if (data.paymentStatus === "paid") {
			const order = await db.query.orders.findFirst({
				where: eq(orders.id, data.orderId),
			});

			if (order?.status === "awaiting_payment") {
				updates.status = "confirmed";
				updates.confirmedAt = new Date();
			}
		}

		// If payment failed/expired, cancel the order
		if (data.paymentStatus === "failed" || data.paymentStatus === "expired") {
			updates.status = "cancelled";
		}

		const [updated] = await db
			.update(orders)
			.set(updates)
			.where(eq(orders.id, data.orderId))
			.returning();

		return updated;
	});

/**
 * Add merchant notes to an order
 */
export const addMerchantNotes = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(addMerchantNotesSchema)
	.handler(async ({ context, data }) => {
		await requireOrderOwnership(data.orderId, context.auth.merchantId);

		const [updated] = await db
			.update(orders)
			.set({ merchantNotes: data.notes })
			.where(eq(orders.id, data.orderId))
			.returning();
		return updated;
	});

/**
 * Cancel an order
 */
export const cancelOrder = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(cancelOrderSchema)
	.handler(async ({ context, data }) => {
		const order = await requireOrderOwnership(
			data.orderId,
			context.auth.merchantId,
		);

		// Validate order can be cancelled
		if (order.status === "completed" || order.status === "cancelled") {
			throw new OrderNotCancellableError(order.status);
		}

		const [updated] = await db
			.update(orders)
			.set({
				status: "cancelled",
				merchantNotes: data.reason
					? `${order.merchantNotes || ""}\nCancelled: ${data.reason}`.trim()
					: order.merchantNotes,
			})
			.where(eq(orders.id, data.orderId))
			.returning();

		return updated;
	});
