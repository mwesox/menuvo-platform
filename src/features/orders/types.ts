/**
 * Order-related TypeScript types.
 *
 * Uses Drizzle's InferSelectModel for database types to ensure
 * type definitions stay in sync with the schema.
 */

import type {
	Order as DbOrder,
	OrderItem as DbOrderItem,
	OrderItemOption as DbOrderItemOption,
	OrderStatus,
	OrderType,
	PaymentStatus,
} from "@/db/schema";

// Re-export database model types with cleaner names
export type Order = DbOrder;
export type OrderItem = DbOrderItem;
export type OrderItemOption = DbOrderItemOption;

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

/**
 * Order item with all related options
 */
export type OrderItemWithOptions = DbOrderItem & {
	options: DbOrderItemOption[];
};

/**
 * Order with all related items and options
 */
export type OrderWithItems = DbOrder & {
	items: OrderItemWithOptions[];
};

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input for creating an order item option (from cart)
 */
export type OrderItemOptionInput = {
	optionGroupId: number;
	optionChoiceId: number;
	groupName: string;
	choiceName: string;
	quantity: number;
	priceModifier: number;
};

/**
 * Input for creating an order item (from cart)
 */
export type OrderItemInput = {
	itemId: number;
	name: string;
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
	storeId: number;
	items: OrderItemInput[];
	orderType: OrderType;
	servicePointId?: number;
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

/**
 * Order statistics for analytics
 */
export type OrderStats = {
	totalOrders: number;
	totalRevenue: number;
	averageOrderValue: number;
	byStatus: Record<OrderStatus, number>;
	byOrderType: Record<OrderType, number>;
};
