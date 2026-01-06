/**
 * Server functions for order export.
 */

import { createServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { orders, stores } from "@/db/schema";
import { type ExportOrderRow, exportOrdersSchema } from "../schemas";

const EXPORT_LIMIT = 1000;

/**
 * Get orders for CSV export - optimized query with flat structure.
 * Returns max 1000 orders with only essential fields.
 * Uses store name instead of store ID for human readability.
 */
export const getOrdersForExport = createServerFn({ method: "GET" })
	.inputValidator(exportOrdersSchema)
	.handler(
		async ({
			data,
		}): Promise<{
			orders: ExportOrderRow[];
			total: number;
			limited: boolean;
		}> => {
			const conditions = [eq(orders.storeId, data.storeId)];

			if (data.status) {
				conditions.push(eq(orders.status, data.status));
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

			// Get count first to know if we're limiting
			const [{ value: total }] = await db
				.select({ value: count() })
				.from(orders)
				.where(and(...conditions));

			// Fetch orders with store name via join
			const result = await db
				.select({
					id: orders.id,
					createdAt: orders.createdAt,
					storeName: stores.name,
					customerName: orders.customerName,
					customerEmail: orders.customerEmail,
					customerPhone: orders.customerPhone,
					orderType: orders.orderType,
					status: orders.status,
					paymentStatus: orders.paymentStatus,
					totalAmount: orders.totalAmount,
				})
				.from(orders)
				.innerJoin(stores, eq(orders.storeId, stores.id))
				.where(and(...conditions))
				.orderBy(desc(orders.createdAt))
				.limit(EXPORT_LIMIT);

			return {
				orders: result.map((order) => ({
					orderId: order.id,
					date: order.createdAt.toISOString(),
					storeName: order.storeName,
					customerName: order.customerName ?? "",
					customerEmail: order.customerEmail ?? "",
					customerPhone: order.customerPhone ?? "",
					orderType: order.orderType,
					status: order.status,
					paymentStatus: order.paymentStatus,
					totalAmount: order.totalAmount,
				})),
				total,
				limited: total > EXPORT_LIMIT,
			};
		},
	);
