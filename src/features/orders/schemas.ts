/**
 * Zod validation schemas for orders.
 *
 * Following the Three Schema Rule:
 * - Server schemas: Real types (numbers, booleans)
 * - Form schemas: Strings (HTML inputs)
 */

import { z } from "zod";
import { orderStatuses, orderTypes, paymentStatuses } from "./constants";

// ============================================================================
// SERVER SCHEMAS (Real Types)
// ============================================================================

/**
 * Schema for order item option input
 */
export const orderItemOptionInputSchema = z.object({
	optionGroupId: z.number().int().positive(),
	optionChoiceId: z.number().int().positive(),
	groupName: z.string().min(1).max(200),
	choiceName: z.string().min(1).max(200),
	quantity: z.number().int().min(1),
	priceModifier: z.number().int(),
});

/**
 * Schema for order item input
 */
export const orderItemInputSchema = z.object({
	itemId: z.number().int().positive(),
	name: z.string().min(1).max(200),
	description: z.string().optional(),
	quantity: z.number().int().min(1),
	unitPrice: z.number().int().min(0),
	optionsPrice: z.number().int().min(0),
	totalPrice: z.number().int().min(0),
	options: z.array(orderItemOptionInputSchema),
});

/**
 * Schema for creating an order
 */
export const createOrderSchema = z.object({
	storeId: z.number().int().positive(),
	items: z
		.array(orderItemInputSchema)
		.min(1, "Order must have at least one item"),
	orderType: z.enum(orderTypes),
	servicePointId: z.number().int().positive().optional(),
	customerName: z.string().max(100).optional(),
	customerEmail: z.string().email().max(255).optional().or(z.literal("")),
	customerPhone: z.string().max(50).optional(),
	customerNotes: z.string().optional(),
	paymentMethod: z.string().min(1).max(50),
	subtotal: z.number().int().min(0),
	taxAmount: z.number().int().min(0),
	tipAmount: z.number().int().min(0),
	totalAmount: z.number().int().min(0),
});

/**
 * Schema for updating order status
 */
export const updateOrderStatusSchema = z.object({
	orderId: z.number().int().positive(),
	status: z.enum(orderStatuses),
});

/**
 * Schema for updating payment status
 */
export const updatePaymentStatusSchema = z.object({
	orderId: z.number().int().positive(),
	paymentStatus: z.enum(paymentStatuses),
	stripeCheckoutSessionId: z.string().optional(),
	stripePaymentIntentId: z.string().optional(),
});

/**
 * Schema for adding merchant notes
 */
export const addMerchantNotesSchema = z.object({
	orderId: z.number().int().positive(),
	notes: z.string().max(1000),
});

/**
 * Schema for cancelling an order
 */
export const cancelOrderSchema = z.object({
	orderId: z.number().int().positive(),
	reason: z.string().max(500).optional(),
});

/**
 * Schema for getting orders by store
 */
export const getOrdersByStoreSchema = z.object({
	storeId: z.number().int().positive(),
	status: z.enum(orderStatuses).optional(),
	paymentStatus: z.enum(paymentStatuses).optional(),
	orderType: z.enum(orderTypes).optional(),
	fromDate: z.string().optional(),
	toDate: z.string().optional(),
	search: z.string().optional(),
	limit: z.number().int().min(1).max(100).default(50),
	offset: z.number().int().min(0).default(0),
});

/**
 * Schema for getting kitchen orders (simplified)
 */
export const getKitchenOrdersSchema = z.object({
	storeId: z.number().int().positive(),
});

/**
 * Schema for getting a single order
 */
export const getOrderSchema = z.object({
	orderId: z.number().int().positive(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateOrderSchemaInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<
	typeof updatePaymentStatusSchema
>;
export type AddMerchantNotesInput = z.infer<typeof addMerchantNotesSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type GetOrdersByStoreInput = z.infer<typeof getOrdersByStoreSchema>;
export type GetKitchenOrdersInput = z.infer<typeof getKitchenOrdersSchema>;
export type GetOrderInput = z.infer<typeof getOrderSchema>;
