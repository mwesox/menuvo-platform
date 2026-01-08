/**
 * Mollie refund webhook handlers.
 *
 * Handles refund lifecycle events from Mollie:
 * - refund.settled: Refund has been completed
 * - refund.failed: Refund has failed
 *
 * Note: Mollie webhooks are "thin" - they only contain the resource ID.
 * The full refund data is fetched by the webhook handler before dispatch.
 */

import { db } from "@menuvo/db";
import { orders } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { mollieLogger } from "../../../lib/logger";
import { registerMollieHandler } from "./registry";

// ============================================
// Refund Payload Type
// ============================================

/**
 * Refund resource structure from Mollie API.
 * This is the full refund object fetched from Mollie after webhook notification.
 */
interface MollieRefund {
	id: string; // re_xxx
	paymentId: string; // tr_xxx
	status: "pending" | "processing" | "refunded" | "queued" | "failed";
	amount: {
		value: string;
		currency: string;
	};
	metadata?: {
		orderId?: string;
		storeId?: string;
		merchantId?: string;
	};
	createdAt?: string;
	description?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Find order by Mollie payment ID.
 */
async function findOrderByPaymentId(paymentId: string) {
	return db.query.orders.findFirst({
		where: eq(orders.molliePaymentId, paymentId),
		columns: {
			id: true,
			storeId: true,
			paymentStatus: true,
			totalAmount: true,
		},
	});
}

/**
 * Parse amount from Mollie format to cents.
 */
function parseAmountToCents(amount: {
	value: string;
	currency: string;
}): number {
	return Math.round(Number.parseFloat(amount.value) * 100);
}

// ============================================
// Event Handlers (Self-Registering)
// ============================================

/**
 * Handle refund.settled event.
 *
 * Called when a Mollie refund has been completed successfully.
 * Updates order payment status to "refunded".
 *
 * Note: For partial refunds, we still set status to "refunded".
 * A more granular approach could track refund amounts separately.
 */
registerMollieHandler(
	"refund.settled",
	async (_eventType, resourceId, payload) => {
		const refund = payload as unknown as MollieRefund;

		mollieLogger.info(
			{
				refundId: resourceId,
				paymentId: refund.paymentId,
				status: refund.status,
				amount: refund.amount,
			},
			"Refund settled",
		);

		// Find order by payment ID
		const order = await findOrderByPaymentId(refund.paymentId);

		if (!order) {
			mollieLogger.warn(
				{
					refundId: resourceId,
					paymentId: refund.paymentId,
				},
				"Refund settled but no order found for payment",
			);
			return;
		}

		// Check if this is a full or partial refund
		const refundAmountCents = parseAmountToCents(refund.amount);
		const isFullRefund = refundAmountCents >= order.totalAmount;

		// Update order payment status
		// Note: Currently we use "refunded" for both full and partial refunds
		// since paymentStatuses enum only has "refunded"
		await db
			.update(orders)
			.set({
				paymentStatus: "refunded",
			})
			.where(eq(orders.id, order.id));

		mollieLogger.info(
			{
				orderId: order.id,
				refundId: resourceId,
				refundAmount: refundAmountCents,
				orderTotal: order.totalAmount,
				isFullRefund,
			},
			"Order payment status updated to refunded",
		);
	},
);

/**
 * Handle refund.failed event.
 *
 * Called when a Mollie refund has failed.
 * Logs the failure but does not change order status
 * (order remains in previous payment state).
 */
registerMollieHandler(
	"refund.failed",
	async (_eventType, resourceId, payload) => {
		const refund = payload as unknown as MollieRefund;

		mollieLogger.error(
			{
				refundId: resourceId,
				paymentId: refund.paymentId,
				status: refund.status,
				amount: refund.amount,
			},
			"Refund failed",
		);

		// Find order by payment ID
		const order = await findOrderByPaymentId(refund.paymentId);

		if (!order) {
			mollieLogger.warn(
				{
					refundId: resourceId,
					paymentId: refund.paymentId,
				},
				"Refund failed but no order found for payment",
			);
			return;
		}

		// If order was optimistically set to "refunded", revert to "paid"
		if (order.paymentStatus === "refunded") {
			await db
				.update(orders)
				.set({
					paymentStatus: "paid",
				})
				.where(eq(orders.id, order.id));

			mollieLogger.info(
				{
					orderId: order.id,
					refundId: resourceId,
				},
				"Order payment status reverted to paid after refund failure",
			);
		} else {
			mollieLogger.info(
				{
					orderId: order.id,
					refundId: resourceId,
					currentStatus: order.paymentStatus,
				},
				"Refund failed, order status unchanged",
			);
		}
	},
);
