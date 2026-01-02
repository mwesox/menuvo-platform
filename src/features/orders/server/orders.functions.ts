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
} from "../validation";

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
		console.log("[createOrder] Creating order:", {
			storeId: data.storeId,
			orderType: data.orderType,
			customerName: data.customerName,
			itemCount: data.items.length,
			items: data.items.map((i) => ({
				id: i.itemId,
				name: i.name,
				qty: i.quantity,
			})),
			subtotal: data.subtotal,
			totalAmount: data.totalAmount,
		});

		try {
			const { orderStatus, paymentStatus } = getInitialOrderStatus(
				data.orderType,
				data.paymentMethod,
			);

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

			console.log("[createOrder] Order created successfully:", order.id);
			return order;
		} catch (error) {
			console.error("[createOrder] FAILED:", error);
			throw error;
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
		const order = await db.query.orders.findFirst({
			where: eq(orders.id, data.orderId),
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
			throw new Error("Order not found");
		}

		return order;
	});

/**
 * Get orders for a store with optional filters
 */
export const getOrdersByStore = createServerFn({ method: "GET" })
	.inputValidator(getOrdersByStoreSchema)
	.handler(async ({ data }) => {
		const conditions = [eq(orders.storeId, data.storeId)];

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

		const result = await db.query.orders.findMany({
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

		return result;
	});

/**
 * Get orders for kitchen monitor (only paid/pay-at-counter orders in active states)
 */
export const getKitchenOrders = createServerFn({ method: "GET" })
	.inputValidator(getKitchenOrdersSchema)
	.handler(async ({ data }) => {
		const result = await db.query.orders.findMany({
			where: and(
				eq(orders.storeId, data.storeId),
				inArray(orders.status, ["confirmed", "preparing", "ready"]),
				inArray(orders.paymentStatus, ["paid", "pay_at_counter"]),
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

		return result;
	});

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update order status with transition validation
 */
export const updateOrderStatus = createServerFn({ method: "POST" })
	.inputValidator(updateOrderStatusSchema)
	.handler(async ({ data }) => {
		// Get current order
		const order = await db.query.orders.findFirst({
			where: eq(orders.id, data.orderId),
		});

		if (!order) {
			throw new Error("Order not found");
		}

		// Validate transition
		if (!canTransitionTo(order.status, data.status)) {
			throw new Error(
				`Cannot transition from ${order.status} to ${data.status}`,
			);
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

			if (order && order.status === "awaiting_payment") {
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
	.inputValidator(addMerchantNotesSchema)
	.handler(async ({ data }) => {
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
	.inputValidator(cancelOrderSchema)
	.handler(async ({ data }) => {
		const order = await db.query.orders.findFirst({
			where: eq(orders.id, data.orderId),
		});

		if (!order) {
			throw new Error("Order not found");
		}

		if (order.status === "completed" || order.status === "cancelled") {
			throw new Error(`Cannot cancel order with status: ${order.status}`);
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
