/**
 * Orders Service Interface
 *
 * Defines the contract for order operations.
 */

import type { orders } from "@menuvo/db/schema";
import type { CreateOrderInput, OrderStatusType } from "./schemas.js";
import type {
	DailyOrderStats,
	DateRange,
	ExportOrder,
	ExportParams,
	OrderStats,
	OrderWithRelations,
} from "./types.js";

/**
 * Orders service interface
 */
export interface IOrderService {
	createOrder(input: CreateOrderInput): Promise<typeof orders.$inferSelect>;

	cancelOrder(
		orderId: string,
		merchantId: string,
		reason?: string,
	): Promise<typeof orders.$inferSelect>;

	updateOrderStatus(
		orderId: string,
		merchantId: string,
		newStatus: OrderStatusType,
	): Promise<typeof orders.$inferSelect>;

	getById(orderId: string): Promise<OrderWithRelations>;

	getOrderStats(
		storeId: string,
		merchantId: string,
		dateRange?: DateRange,
	): Promise<OrderStats>;

	getDailyOrderStats(
		storeId: string,
		merchantId: string,
		startDate: Date,
		endDate?: Date,
	): Promise<DailyOrderStats[]>;

	getOrdersForExport(params: ExportParams): Promise<ExportOrder[]>;
}
