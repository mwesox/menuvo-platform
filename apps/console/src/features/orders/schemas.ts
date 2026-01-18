/**
 * Schemas for console orders domains (export, etc.)
 */

import { z } from "zod/v4";

/**
 * Flat response type for CSV export - uses names instead of IDs
 */
export const exportOrderRowSchema = z.object({
	orderId: z.string().uuid(),
	date: z.string(),
	storeName: z.string(),
	customerName: z.string(),
	customerEmail: z.string(),
	customerPhone: z.string(),
	orderType: z.string(),
	status: z.string(),
	paymentStatus: z.string(),
	totalAmount: z.number(),
});

export type ExportOrderRow = z.infer<typeof exportOrderRowSchema>;
