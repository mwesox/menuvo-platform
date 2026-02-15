/**
 * Order Schemas
 *
 * Zod schemas for order-related API operations.
 * Following the Three Schema Rule:
 * - API schemas (typed) - defined here
 * - Form schemas (strings) - defined in app domains
 * - Database schemas - defined in @menuvo/db/schema (no enum constraints)
 */

import { z } from "zod";

/**
 * Order status enum (fulfillment workflow)
 */
export const orderStatuses = [
	"awaiting_payment",
	"confirmed",
	"preparing",
	"ready",
	"completed",
	"cancelled",
] as const;
export const orderStatusEnum = z.enum(orderStatuses);

export type OrderStatusType = z.infer<typeof orderStatusEnum>;

/**
 * Payment status enum
 */
export const paymentStatuses = [
	"pending",
	"awaiting_confirmation",
	"paid",
	"pay_at_counter",
	"failed",
	"refunded",
	"expired",
] as const;
export const paymentStatusEnum = z.enum(paymentStatuses);

export type PaymentStatusType = z.infer<typeof paymentStatusEnum>;

/**
 * Order type enum
 */
export const orderTypes = ["dine_in", "takeaway", "delivery"] as const;
export const orderTypeEnum = z.enum(orderTypes);

export type OrderTypeValue = z.infer<typeof orderTypeEnum>;

// ============================================================================
// Order Item Schemas
// ============================================================================

/**
 * Selected option for an order item
 */
export const orderItemOptionInputSchema = z.object({
	optionGroupId: z.string().uuid(),
	optionChoiceId: z.string().uuid(),
	quantity: z.number().int().positive().default(1),
});

export type OrderItemOptionInput = z.infer<typeof orderItemOptionInputSchema>;

/**
 * Order item input schema (for order creation)
 */
export const orderItemInputSchema = z.object({
	itemId: z.string().uuid(),
	quantity: z.number().int().positive(),
	options: z.array(orderItemOptionInputSchema).optional(),
	specialInstructions: z.string().max(500).optional(),
	/** Whether this item was added from AI recommendations */
	fromRecommendation: z.boolean().optional().default(false),
});

export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

// ============================================================================
// Create Order Schemas
// ============================================================================

/**
 * Create order - API schema
 * Used for customer checkout (public procedure)
 */
export const createOrderSchema = z.object({
	storeId: z.string().uuid(),
	servicePointId: z.string().uuid().optional(),
	orderType: orderTypeEnum,
	items: z.array(orderItemInputSchema).min(1, "At least one item is required"),
	customerName: z.string().min(1).max(100).optional(),
	customerPhone: z.string().max(50).optional(),
	customerEmail: z.string().email().optional(),
	customerNotes: z.string().max(1000).optional(),
	scheduledPickupTime: z.coerce.date().optional(),
	idempotencyKey: z.string().uuid().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ============================================================================
// Query Schemas
// ============================================================================

/**
 * Get order by ID - API schema
 */
export const getOrderByIdSchema = z.object({
	orderId: z.string().uuid(),
});

export type GetOrderByIdInput = z.infer<typeof getOrderByIdSchema>;

/**
 * Get order by order ID (alias for tracking page)
 */
export const getOrderByOrderIdSchema = z.object({
	orderId: z.string().uuid(),
});

export type GetOrderByOrderIdInput = z.infer<typeof getOrderByOrderIdSchema>;

/**
 * List orders - API schema
 * Used by store owners to view their orders
 */
export const listOrdersSchema = z.object({
	storeId: z.string().uuid(),
	status: orderStatusEnum.optional(),
	paymentStatus: paymentStatusEnum.optional(),
	orderType: orderTypeEnum.optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
	limit: z.number().int().min(1).max(100).default(50),
	cursor: z.string().optional(),
});

export type ListOrdersInput = z.infer<typeof listOrdersSchema>;

// ============================================================================
// Update Schemas
// ============================================================================

/**
 * Update order status - API schema
 */
export const updateOrderStatusSchema = z.object({
	orderId: z.string().uuid(),
	status: orderStatusEnum,
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

/**
 * Cancel order - API schema
 */
export const cancelOrderSchema = z.object({
	orderId: z.string().uuid(),
	reason: z.string().max(500).optional(),
});

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

// ============================================================================
// Statistics Schemas
// ============================================================================

/**
 * Get order statistics - API schema
 */
export const getOrderStatsSchema = z.object({
	storeId: z.string().uuid(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
});

export type GetOrderStatsInput = z.infer<typeof getOrderStatsSchema>;

/**
 * Get daily order statistics - API schema
 * For charts showing order trends over time
 */
export const getDailyStatsSchema = z.object({
	storeId: z.string().uuid(),
	startDate: z.coerce.date(),
	endDate: z.coerce.date().optional(),
});

export type GetDailyStatsInput = z.infer<typeof getDailyStatsSchema>;

/**
 * Order statistics response
 */
export const orderStatsResponseSchema = z.object({
	totalOrders: z.number().int(),
	totalRevenue: z.number().int(), // In cents
	averageOrderValue: z.number().int(), // In cents
	ordersByStatus: z.record(orderStatusEnum, z.number().int()),
	ordersByType: z.record(orderTypeEnum, z.number().int()),
});

export type OrderStatsResponse = z.infer<typeof orderStatsResponseSchema>;

// ============================================================================
// Export Schemas
// ============================================================================

/**
 * Get orders for export - API schema
 * Returns orders in a format suitable for CSV export
 */
export const getOrdersForExportSchema = z.object({
	storeId: z.string().uuid(),
	startDate: z.coerce.date(),
	endDate: z.coerce.date(),
	status: orderStatusEnum.optional(),
});

export type GetOrdersForExportInput = z.infer<typeof getOrdersForExportSchema>;

// ============================================================================
// Refund Schemas
// ============================================================================

/**
 * Create refund - API schema
 * For Mollie refunds
 */
export const createRefundSchema = z.object({
	orderId: z.string().uuid(),
	amount: z.number().int().positive().optional(), // Partial refund amount in cents, omit for full refund
	description: z.string().max(255).optional(),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;

/**
 * Refund response
 */
export const refundResponseSchema = z.object({
	success: z.boolean(),
	refundId: z.string().optional(),
	amount: z.number().int().optional(), // Amount refunded in cents
	message: z.string().optional(),
});

export type RefundResponse = z.infer<typeof refundResponseSchema>;
