/**
 * Schemas for console orders features (export, etc.)
 */

import { z } from "zod";
import { orderStatuses } from "@/features/orders";

/**
 * Schema for exporting orders to CSV
 * Max 1000 orders for performance
 */
export const exportOrdersSchema = z.object({
	storeId: z.number().int().positive(),
	status: z.enum(orderStatuses).optional(),
	fromDate: z.string().optional(),
	toDate: z.string().optional(),
	search: z.string().optional(),
});

export type ExportOrdersInput = z.infer<typeof exportOrdersSchema>;

/**
 * Flat response type for CSV export - uses names instead of IDs
 */
export interface ExportOrderRow {
	orderId: number;
	date: string;
	storeName: string;
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	orderType: string;
	status: string;
	paymentStatus: string;
	totalAmount: number;
}
