/**
 * Orders Domain Types
 *
 * Domain types for order operations.
 */

import type { orderItemOptions, orderItems, orders } from "@menuvo/db/schema";
import type {
	OrderStatusType,
	OrderTypeValue,
	PaymentStatusType,
} from "./schemas.js";

/**
 * Database item for price calculation
 */
export interface DbItem {
	id: string;
	price: number;
	kitchenName: string | null;
	translations: unknown;
}

/**
 * Option choice for price calculation
 */
export interface OptionChoice {
	id: string;
	priceModifier: number;
	translations: unknown;
	optionGroupId: string;
}

/**
 * Option group for display
 */
export interface OptionGroup {
	id: string;
	translations: unknown;
}

/**
 * Calculated order item data
 */
export interface CalculatedOrderItem {
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
	/** Whether this item was added from AI recommendations */
	fromRecommendation?: boolean;
	options?: Array<{
		optionGroupId: string;
		optionChoiceId: string;
		groupName: string;
		choiceName: string;
		quantity: number;
		priceModifier: number;
	}>;
}

/**
 * Order totals calculation result
 */
export interface OrderTotals {
	subtotal: number;
	items: CalculatedOrderItem[];
}

/**
 * Date range for filtering
 */
export interface DateRange {
	startDate?: Date;
	endDate?: Date;
}

/**
 * Order statistics result
 */
export interface OrderStats {
	totalOrders: number;
	totalRevenue: number;
	averageOrderValue: number;
	ordersByStatus: Record<OrderStatusType, number>;
	ordersByType: Record<OrderTypeValue, number>;
}

/**
 * Daily order statistics for charts
 */
export interface DailyOrderStats {
	date: string; // ISO date string (YYYY-MM-DD)
	orders: number;
	revenue: number; // In cents
}

/**
 * Export order format
 */
export interface ExportOrder {
	orderId: string;
	createdAt: Date;
	status: OrderStatusType;
	paymentStatus: PaymentStatusType;
	orderType: OrderTypeValue;
	customerName: string | null;
	customerEmail: string | null;
	customerPhone: string | null;
	servicePoint: string | null;
	subtotal: number;
	taxAmount: number;
	tipAmount: number;
	totalAmount: number;
	currency: string;
	items: Array<{
		name: string;
		quantity: number;
		unitPrice: number;
		optionsPrice: number;
		totalPrice: number;
		options: Array<{
			groupName: string;
			choiceName: string;
			quantity: number;
			priceModifier: number;
		}>;
	}>;
}

/**
 * Export parameters
 */
export interface ExportParams {
	storeId: string;
	merchantId: string;
	startDate: Date;
	endDate: Date;
	status?: OrderStatusType;
}

/**
 * Order with relations (for public order retrieval)
 */
export type OrderWithRelations = typeof orders.$inferSelect & {
	store: {
		id: string;
		name: string;
		slug: string;
		currency: string;
	};
	servicePoint: {
		id: string;
		name: string;
		code: string;
	} | null;
	items: Array<
		typeof orderItems.$inferSelect & {
			options: Array<typeof orderItemOptions.$inferSelect>;
		}
	>;
};
