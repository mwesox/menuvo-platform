/**
 * Order-related TypeScript types for the Shop app.
 *
 * These types are defined locally to avoid importing from @menuvo/db.
 * They should match the tRPC response types.
 */

import type { OrderStatus, OrderType, PaymentStatus } from "./constants";

// ============================================================================
// ORDER TYPES
// ============================================================================

/**
 * Order entity
 */
export type Order = {
	id: string;
	storeId: string;
	orderNumber: number | null;
	status: OrderStatus;
	orderType: OrderType;
	paymentStatus: PaymentStatus;
	paymentMethod: string | null;
	servicePointId: string | null;
	customerName: string | null;
	customerEmail: string | null;
	customerPhone: string | null;
	customerNotes: string | null;
	subtotal: number;
	taxAmount: number;
	tipAmount: number;
	totalAmount: number;
	molliePaymentId: string | null;
	stripeCheckoutSessionId: string | null;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Order item entity
 */
export type OrderItem = {
	id: string;
	orderId: string;
	itemId: string | null;
	name: string;
	kitchenName: string | null;
	description: string | null;
	quantity: number;
	unitPrice: number;
	optionsPrice: number;
	totalPrice: number;
};

/**
 * Order item option entity
 */
export type OrderItemOption = {
	id: string;
	orderItemId: string;
	optionGroupId: string | null;
	optionChoiceId: string | null;
	groupName: string;
	choiceName: string;
	quantity: number;
	priceModifier: number;
};

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

/**
 * Order item with all related options
 */
export type OrderItemWithOptions = OrderItem & {
	options: OrderItemOption[];
};

/**
 * Order with all related items and options
 */
export type OrderWithItems = Order & {
	items: OrderItemWithOptions[];
};

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input for creating an order item option (from cart)
 */
export type OrderItemOptionInput = {
	optionGroupId: string;
	optionChoiceId: string;
	groupName: string;
	choiceName: string;
	quantity: number;
	priceModifier: number;
};

/**
 * Input for creating an order item (from cart)
 */
export type OrderItemInput = {
	itemId: string;
	name: string;
	kitchenName?: string | null;
	description?: string;
	quantity: number;
	unitPrice: number;
	optionsPrice: number;
	totalPrice: number;
	options: OrderItemOptionInput[];
};

/**
 * Input for creating an order
 */
export type CreateOrderInput = {
	storeId: string;
	items: OrderItemInput[];
	orderType: OrderType;
	servicePointId?: string;
	customerName?: string;
	customerEmail?: string;
	customerPhone?: string;
	customerNotes?: string;
	paymentMethod: string;
	subtotal: number;
	taxAmount: number;
	tipAmount: number;
	totalAmount: number;
};

// ============================================================================
// FILTER AND QUERY TYPES
// ============================================================================

/**
 * Filters for querying orders
 */
export type OrderFilters = {
	status?: OrderStatus | OrderStatus[];
	paymentStatus?: PaymentStatus | PaymentStatus[];
	orderType?: OrderType | OrderType[];
	fromDate?: Date;
	toDate?: Date;
	search?: string;
};
