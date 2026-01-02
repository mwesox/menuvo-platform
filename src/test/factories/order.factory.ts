/**
 * Factory for creating test orders with items.
 */

import {
	type OrderStatus,
	type OrderType,
	orderItemOptions,
	orderItems,
	orders,
	type PaymentStatus,
} from "@/db/schema";
import { testDb } from "../db";
import { uniqueEmail, uniqueId } from "../utils/test-id";

export interface OrderItemOptionInput {
	groupName: string;
	choiceName: string;
	priceModifier: number;
}

export interface OrderItemInput {
	itemId?: number | null;
	name: string;
	quantity: number;
	unitPrice: number;
	optionsPrice?: number;
	options?: OrderItemOptionInput[];
}

export interface OrderFactoryOptions {
	testRunId: string;
	storeId: number;
	status?: OrderStatus;
	paymentStatus?: PaymentStatus;
	orderType?: OrderType;
	items?: OrderItemInput[];
	customerName?: string;
	customerEmail?: string;
}

export async function createTestOrder(options: OrderFactoryOptions) {
	const {
		testRunId,
		storeId,
		status = "confirmed",
		paymentStatus = "paid",
		orderType = "takeaway",
		items: itemsInput = [{ name: "Test Item", quantity: 1, unitPrice: 1000 }],
		customerName,
		customerEmail,
	} = options;

	// Calculate totals
	const subtotal = itemsInput.reduce((sum, item) => {
		const optionsTotal =
			item.options?.reduce((o, opt) => o + opt.priceModifier, 0) || 0;
		return sum + (item.unitPrice + optionsTotal) * item.quantity;
	}, 0);

	const order = await testDb.transaction(async (tx) => {
		const [newOrder] = await tx
			.insert(orders)
			.values({
				storeId,
				customerName: customerName || `Test Customer ${uniqueId(testRunId)}`,
				customerEmail: customerEmail || uniqueEmail(testRunId),
				orderType,
				status,
				paymentStatus,
				paymentMethod:
					paymentStatus === "pay_at_counter" ? "pay_at_counter" : "card",
				subtotal,
				taxAmount: 0,
				tipAmount: 0,
				totalAmount: subtotal,
			})
			.returning();

		// Insert items
		for (let i = 0; i < itemsInput.length; i++) {
			const item = itemsInput[i];
			const optionsPrice =
				item.optionsPrice ??
				(item.options?.reduce((o, opt) => o + opt.priceModifier, 0) || 0);

			const [orderItem] = await tx
				.insert(orderItems)
				.values({
					orderId: newOrder.id,
					itemId: item.itemId || null,
					name: item.name,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					optionsPrice,
					totalPrice: (item.unitPrice + optionsPrice) * item.quantity,
					displayOrder: i,
				})
				.returning();

			if (item.options && item.options.length > 0) {
				await tx.insert(orderItemOptions).values(
					item.options.map((opt) => ({
						orderItemId: orderItem.id,
						groupName: opt.groupName,
						choiceName: opt.choiceName,
						quantity: 1,
						priceModifier: opt.priceModifier,
					})),
				);
			}
		}

		return newOrder;
	});

	return order;
}
