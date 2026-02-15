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

import { orderItems, orders, stores } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gt, gte, inArray, lt, lte, or } from "drizzle-orm";
import { z } from "zod";
import {
	publicProcedure,
	router,
	storeOwnerProcedure,
} from "../../trpc/trpc.js";
import {
	cancelOrderSchema,
	createOrderSchema,
	createRefundSchema,
	getDailyStatsSchema,
	getOrderByIdSchema,
	getOrderStatsSchema,
	getOrdersForExportSchema,
	listOrdersSchema,
	updateOrderStatusSchema,
} from "./schemas.js";

// Schema for createPayment input
const createPaymentSchema = z.object({
	orderId: z.string().uuid(),
	returnUrl: z.string().url(),
	cancelUrl: z.string().url(),
});

// Schema for capturePayment input
const capturePaymentSchema = z.object({
	orderId: z.string().uuid(),
});

const ORDER_CURSOR_SEPARATOR = "|";

function encodeOrderCursor(date: Date, orderId: string): string {
	return `${date.toISOString()}${ORDER_CURSOR_SEPARATOR}${orderId}`;
}

function decodeOrderCursor(
	cursor: string,
): { date: Date; orderId: string } | null {
	const [datePart, orderId] = cursor.split(ORDER_CURSOR_SEPARATOR);
	if (!datePart || !orderId) {
		return null;
	}

	const date = new Date(datePart);
	if (Number.isNaN(date.getTime())) {
		return null;
	}

	return { date, orderId };
}

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
			try {
				return await ctx.services.orders.createOrder(input);
			} catch (error) {
				if (error instanceof Error) {
					if (
						error.message.includes("not found") ||
						error.message.includes("not active")
					) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("Failed to create")) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Get order by ID (public - for order tracking)
	 */
	getById: publicProcedure
		.input(getOrderByIdSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.orders.getById(input.orderId);
			} catch (error) {
				if (error instanceof Error && error.message === "Order not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Order not found",
					});
				}
				throw error;
			}
		}),

	/**
	 * Get order by order ID (alias for tracking)
	 * Same as getById but named more explicitly for tracking pages
	 */
	getByOrderId: publicProcedure
		.input(getOrderByIdSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.orders.getById(input.orderId);
			} catch (error) {
				if (error instanceof Error && error.message === "Order not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Order not found",
					});
				}
				throw error;
			}
		}),

	/**
	 * Create a payment for an order (public - for checkout)
	 * Returns the PayPal approval URL for redirect.
	 *
	 * Security: merchantId is derived from order→store→merchant relationship,
	 * NOT from client input.
	 */
	createPayment: publicProcedure
		.input(createPaymentSchema)
		.mutation(async ({ ctx, input }) => {
			// 1. Fetch order with store and merchant info
			const order = await ctx.db.query.orders.findFirst({
				where: and(
					eq(orders.id, input.orderId),
					eq(orders.status, "awaiting_payment"),
				),
				with: {
					items: true,
					store: {
						columns: { id: true, name: true, currency: true },
						with: {
							merchant: {
								columns: {
									id: true,
									paypalPaymentsReceivable: true,
								},
							},
						},
					},
				},
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found or not awaiting payment",
				});
			}

			// 2. Validate merchant can accept payments
			if (!order.store.merchant?.paypalPaymentsReceivable) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "Store cannot accept online payments",
				});
			}

			// 3. Build payment params
			const amount = {
				value: (order.totalAmount / 100).toFixed(2),
				currency: order.store.currency.toUpperCase(),
			};
			const description = `Order #${String(order.pickupNumber).padStart(3, "0")} - ${order.store.name}`;
			const returnUrl = `${input.returnUrl}?order_id=${order.id}`;
			const cancelUrl = `${input.cancelUrl}?order_id=${order.id}`;

			// 4. Create payment via PaymentService
			// NOTE: merchantId is inferred from orderId internally (security: never from client input!)
			const paymentResult = await ctx.services.payments.createPayment({
				orderId: order.id,
				storeId: order.storeId,
				amount,
				description,
				returnUrl,
				cancelUrl,
			});

			if (!paymentResult.approvalUrl) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Payment provider did not return approval URL",
				});
			}

			// 5. Update order with payment info
			await ctx.db
				.update(orders)
				.set({
					paypalOrderId: paymentResult.paymentId,
					paymentStatus: "awaiting_confirmation",
				})
				.where(eq(orders.id, order.id));

			return { approvalUrl: paymentResult.approvalUrl };
		}),

	/**
	 * Capture a payment after customer approval (public - for checkout)
	 *
	 * Called after customer approves the payment on PayPal.
	 * This actually processes the payment and confirms the order.
	 *
	 * Input: orderId only (security: no payment IDs from frontend)
	 */
	capturePayment: publicProcedure
		.input(capturePaymentSchema)
		.mutation(async ({ ctx, input }) => {
			// 1. Get order from database
			const order = await ctx.db.query.orders.findFirst({
				where: eq(orders.id, input.orderId),
				columns: {
					id: true,
					paypalOrderId: true,
					paymentStatus: true,
					status: true,
				},
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			if (!order.paypalOrderId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "No PayPal order found for this order",
				});
			}

			// 2. Already paid - return success
			if (order.paymentStatus === "paid") {
				return { paymentStatus: "paid" as const, success: true };
			}

			// 3. Fetch provider status first to avoid duplicate/invalid captures
			const providerStatus = await ctx.services.payments.getPaymentStatus(
				input.orderId,
			);

			// Already paid/captured on provider side - just sync local state
			if (providerStatus.isPaid) {
				await ctx.db
					.update(orders)
					.set({
						paymentStatus: "paid",
						status: "confirmed",
						confirmedAt: new Date(),
						...(providerStatus.captureId && {
							paypalCaptureId: providerStatus.captureId,
						}),
					})
					.where(eq(orders.id, input.orderId));

				return { paymentStatus: "paid" as const, success: true };
			}

			// Provider marks order as failed/voided/expired
			if (providerStatus.isFailed) {
				await ctx.db
					.update(orders)
					.set({
						paymentStatus: "failed",
						status: "cancelled",
					})
					.where(eq(orders.id, input.orderId));

				return { paymentStatus: "failed" as const, success: false };
			}

			// Not approved yet; do not mutate order state
			if (!providerStatus.isApproved) {
				return { paymentStatus: order.paymentStatus, success: false };
			}

			// 4. Capture approved payment
			try {
				const captureResult = await ctx.services.payments.capturePayment(
					input.orderId,
				);

				// 5. Update order with capture info
				await ctx.db
					.update(orders)
					.set({
						paypalCaptureId: captureResult.captureId,
						paymentStatus: "paid",
						status: "confirmed",
						confirmedAt: new Date(),
					})
					.where(eq(orders.id, input.orderId));

				return { paymentStatus: "paid" as const, success: true };
			} catch {
				// Do not cancel locally on transient capture/provider failures.
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Payment approved but capture is not finalized yet",
				});
			}
		}),

	/**
	 * Verify payment status for an order (public - for checkout return)
	 *
	 * Called when customer returns from PayPal payment page.
	 * Checks PayPal API for payment status and updates order if needed.
	 *
	 * Input: orderId only (security: no payment IDs from frontend)
	 * Returns: paymentStatus only (no internal IDs exposed)
	 */
	verifyPayment: publicProcedure
		.input(z.object({ orderId: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			// 1. Get order from database
			const order = await ctx.db.query.orders.findFirst({
				where: eq(orders.id, input.orderId),
				columns: {
					id: true,
					paypalOrderId: true,
					paymentStatus: true,
					status: true,
				},
			});

			if (!order) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Order not found",
				});
			}

			// 2. If no PayPal order ID, return current status
			if (!order.paypalOrderId) {
				return { paymentStatus: order.paymentStatus };
			}

			// 3. Check payment status with PaymentService
			// NOTE: merchantId is inferred from orderId internally (security: never from client input!)
			const providerStatus = await ctx.services.payments.getPaymentStatus(
				input.orderId,
			);

			// 4. Update database if payment confirmed/captured
			if (providerStatus.isPaid && order.paymentStatus !== "paid") {
				await ctx.db
					.update(orders)
					.set({
						paymentStatus: "paid",
						status: "confirmed",
						confirmedAt: new Date(),
						...(providerStatus.captureId && {
							paypalCaptureId: providerStatus.captureId,
						}),
					})
					.where(eq(orders.id, input.orderId));

				return { paymentStatus: "paid" as const };
			}

			// 5. If approved but not captured, auto-capture
			if (
				providerStatus.isApproved &&
				!providerStatus.isPaid &&
				order.paymentStatus !== "paid"
			) {
				try {
					const captureResult = await ctx.services.payments.capturePayment(
						input.orderId,
					);

					await ctx.db
						.update(orders)
						.set({
							paypalCaptureId: captureResult.captureId,
							paymentStatus: "paid",
							status: "confirmed",
							confirmedAt: new Date(),
						})
						.where(eq(orders.id, input.orderId));

					return { paymentStatus: "paid" as const };
				} catch {
					// Capture failed - leave status as is
				}
			}

			// 6. Update database if payment failed
			if (providerStatus.isFailed && order.paymentStatus !== "failed") {
				await ctx.db
					.update(orders)
					.set({
						paymentStatus: "failed",
						status: "cancelled",
					})
					.where(eq(orders.id, input.orderId));

				return { paymentStatus: "failed" as const };
			}

			// 7. No status change needed
			return { paymentStatus: order.paymentStatus };
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
					eq(stores.merchantId, ctx.session.merchantId),
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
				const decodedCursor = decodeOrderCursor(input.cursor);
				if (!decodedCursor) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid cursor",
					});
				}

				const cursorCondition = or(
					lt(orders.createdAt, decodedCursor.date),
					and(
						eq(orders.createdAt, decodedCursor.date),
						lt(orders.id, decodedCursor.orderId),
					),
				);
				if (cursorCondition) {
					conditions.push(cursorCondition);
				}
			}

			const storeOrders = await ctx.db.query.orders.findMany({
				where: and(...conditions),
				orderBy: [desc(orders.createdAt), desc(orders.id)],
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
			const lastOrder = ordersToReturn[ordersToReturn.length - 1];
			const nextCursor =
				hasMore && lastOrder
					? encodeOrderCursor(lastOrder.createdAt, lastOrder.id)
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
			try {
				return await ctx.services.orders.updateOrderStatus(
					input.orderId,
					ctx.session.merchantId,
					input.status,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Order not found") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("access")) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: error.message,
						});
					}
					if (error.message.includes("Failed to update")) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Cancel an order (store owner only)
	 */
	cancel: storeOwnerProcedure
		.input(cancelOrderSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				const cancelledOrder = await ctx.services.orders.cancelOrder(
					input.orderId,
					ctx.session.merchantId,
					input.reason,
				);
				return { success: true, order: cancelledOrder };
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Order not found") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("access")) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: error.message,
						});
					}
					if (error.message.includes("Cannot cancel")) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: error.message,
						});
					}
					if (error.message.includes("Failed to cancel")) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Get order statistics for a store (store owner only)
	 */
	getStats: storeOwnerProcedure
		.input(getOrderStatsSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.orders.getOrderStats(
					input.storeId,
					ctx.session.merchantId,
					{
						startDate: input.startDate,
						endDate: input.endDate,
					},
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("access")) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Get daily order statistics for charts (store owner only)
	 * Returns daily order counts and revenue for the specified date range
	 */
	getDailyStats: storeOwnerProcedure
		.input(getDailyStatsSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.orders.getDailyOrderStats(
					input.storeId,
					ctx.session.merchantId,
					input.startDate,
					input.endDate,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("access")) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Get orders for export (store owner only)
	 * Returns orders in a format suitable for CSV export
	 */
	getForExport: storeOwnerProcedure
		.input(getOrdersForExportSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.orders.getOrdersForExport({
					storeId: input.storeId,
					merchantId: ctx.session.merchantId,
					startDate: input.startDate,
					endDate: input.endDate,
					status: input.status,
				});
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("access")) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Create a refund (store owner only)
	 * Initiates a refund through the payment provider for the order
	 *
	 * Note: The actual API call should be made by the API layer.
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
					paypalCaptureId: true,
					stripePaymentIntentId: true,
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

			if (order.store.merchantId !== ctx.session.merchantId) {
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
			const paymentProvider = order.paypalCaptureId ? "paypal" : "stripe";
			const paymentId = order.paypalCaptureId ?? order.stripePaymentIntentId;

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

	/**
	 * List orders for kitchen display (active orders)
	 * Returns orders in confirmed, preparing, ready status for kitchen management
	 */
	listForKitchen: storeOwnerProcedure
		.input(listOrdersSchema)
		.query(async ({ ctx, input }) => {
			// Verify the store belongs to the authenticated user
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, input.storeId),
					eq(stores.merchantId, ctx.session.merchantId),
				),
				columns: { id: true },
			});

			if (!store) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this store",
				});
			}

			// Build where conditions - only active kitchen orders
			const conditions = [
				eq(orders.storeId, input.storeId),
				inArray(orders.status, ["confirmed", "preparing", "ready"]),
			];

			// Add cursor condition if provided
			if (input.cursor) {
				const decodedCursor = decodeOrderCursor(input.cursor);
				if (!decodedCursor) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid cursor",
					});
				}

				const cursorCondition = or(
					gt(orders.createdAt, decodedCursor.date),
					and(
						eq(orders.createdAt, decodedCursor.date),
						gt(orders.id, decodedCursor.orderId),
					),
				);
				if (cursorCondition) {
					conditions.push(cursorCondition);
				}
			}

			const kitchenOrders = await ctx.db.query.orders.findMany({
				where: and(...conditions),
				orderBy: [asc(orders.createdAt), asc(orders.id)], // FIFO for kitchen
				limit: input.limit + 1, // Fetch one extra to determine if there's more
				with: {
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

			// Determine if there are more results
			const hasMore = kitchenOrders.length > input.limit;
			const ordersToReturn = hasMore
				? kitchenOrders.slice(0, input.limit)
				: kitchenOrders;
			const lastOrder = ordersToReturn[ordersToReturn.length - 1];
			const nextCursor =
				hasMore && lastOrder
					? encodeOrderCursor(lastOrder.createdAt, lastOrder.id)
					: null;

			return {
				orders: ordersToReturn,
				nextCursor,
			};
		}),

	/**
	 * List completed orders for kitchen (done orders)
	 * Returns recently completed orders (last 24 hours) for kitchen reference
	 */
	kitchenDone: storeOwnerProcedure
		.input(listOrdersSchema)
		.query(async ({ ctx, input }) => {
			// Verify the store belongs to the authenticated user
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, input.storeId),
					eq(stores.merchantId, ctx.session.merchantId),
				),
				columns: { id: true },
			});

			if (!store) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this store",
				});
			}

			// Only show completed orders from last 24 hours
			const yesterday = new Date();
			yesterday.setHours(yesterday.getHours() - 24);

			// Build where conditions
			const conditions = [
				eq(orders.storeId, input.storeId),
				eq(orders.status, "completed"),
				gte(orders.completedAt, yesterday),
			];

			// Add cursor condition if provided
			if (input.cursor) {
				const decodedCursor = decodeOrderCursor(input.cursor);
				if (!decodedCursor) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid cursor",
					});
				}

				const cursorCondition = or(
					lt(orders.completedAt, decodedCursor.date),
					and(
						eq(orders.completedAt, decodedCursor.date),
						lt(orders.id, decodedCursor.orderId),
					),
				);
				if (cursorCondition) {
					conditions.push(cursorCondition);
				}
			}

			const doneOrders = await ctx.db.query.orders.findMany({
				where: and(...conditions),
				orderBy: [desc(orders.completedAt), desc(orders.id)], // Most recent first
				limit: input.limit + 1, // Fetch one extra to determine if there's more
				with: {
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

			// Determine if there are more results
			const hasMore = doneOrders.length > input.limit;
			const ordersToReturn = hasMore
				? doneOrders.slice(0, input.limit)
				: doneOrders;
			const lastOrder = ordersToReturn[ordersToReturn.length - 1];
			const nextCursor =
				hasMore && lastOrder?.completedAt
					? encodeOrderCursor(lastOrder.completedAt, lastOrder.id)
					: null;

			return {
				orders: ordersToReturn,
				nextCursor,
			};
		}),

	/**
	 * Generic list orders procedure (alias for listByStore for console app compatibility)
	 */
	list: storeOwnerProcedure
		.input(listOrdersSchema)
		.query(async ({ ctx, input }) => {
			// Verify the store belongs to the authenticated user first
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, input.storeId),
					eq(stores.merchantId, ctx.session.merchantId),
				),
				columns: { id: true },
			});

			if (!store) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have access to this store",
				});
			}

			// Now get the orders
			const conditions = [eq(orders.storeId, input.storeId)];
			if (input.cursor) {
				const decodedCursor = decodeOrderCursor(input.cursor);
				if (!decodedCursor) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid cursor",
					});
				}

				const cursorCondition = or(
					lt(orders.createdAt, decodedCursor.date),
					and(
						eq(orders.createdAt, decodedCursor.date),
						lt(orders.id, decodedCursor.orderId),
					),
				);
				if (cursorCondition) {
					conditions.push(cursorCondition);
				}
			}

			const storeOrders = await ctx.db.query.orders.findMany({
				where: and(...conditions),
				orderBy: [desc(orders.createdAt), desc(orders.id)],
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
			const lastOrder = ordersToReturn[ordersToReturn.length - 1];
			const nextCursor =
				hasMore && lastOrder
					? encodeOrderCursor(lastOrder.createdAt, lastOrder.id)
					: null;

			return {
				orders: ordersToReturn,
				nextCursor,
			};
		}),
});

export type OrderRouter = typeof orderRouter;
