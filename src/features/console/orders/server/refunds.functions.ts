"use server";

/**
 * Mollie Refund server functions for order refunds.
 *
 * Enables merchants to issue full or partial refunds for paid orders.
 * Uses stored OAuth tokens for M2M operations on behalf of merchants.
 *
 * Flow:
 * 1. Merchant requests refund via console
 * 2. createMollieRefund() validates order and triggers refund via Mollie API
 * 3. Mollie processes refund (may take time depending on payment method)
 * 4. Mollie webhook (refund.settled/refund.failed) updates order status
 */

import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { withAuth } from "@/features/console/auth/server/auth-middleware";
import { NotFoundError } from "@/lib/errors";
import { mollieLogger } from "@/lib/logger";
import { getMerchantMollieClient } from "@/lib/mollie/connect";

// ============================================================================
// SCHEMAS
// ============================================================================

const createMollieRefundSchema = z.object({
	orderId: z.string().uuid(),
	/** Optional amount in cents for partial refund. If omitted, full refund. */
	amount: z.number().int().positive().optional(),
	/** Optional description for the refund */
	description: z.string().max(255).optional(),
});

const getMollieRefundStatusSchema = z.object({
	orderId: z.string().uuid(),
	refundId: z.string().min(1),
});

// ============================================================================
// TYPES
// ============================================================================

export type CreateMollieRefundInput = z.infer<typeof createMollieRefundSchema>;
export type GetMollieRefundStatusInput = z.infer<
	typeof getMollieRefundStatusSchema
>;

// ============================================================================
// ERRORS
// ============================================================================

export class OrderNotRefundableError extends Error {
	constructor(
		public orderId: string,
		public reason: string,
	) {
		super(`Order ${orderId} cannot be refunded: ${reason}`);
		this.name = "OrderNotRefundableError";
	}
}

export class RefundAmountExceedsPaymentError extends Error {
	constructor(
		public orderId: string,
		public requestedAmount: number,
		public maxAmount: number,
	) {
		super(
			`Refund amount ${requestedAmount} exceeds maximum refundable amount ${maxAmount} for order ${orderId}`,
		);
		this.name = "RefundAmountExceedsPaymentError";
	}
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find an order with merchant details for refund processing.
 * Validates that the order belongs to the authenticated merchant.
 */
async function findOrderForRefund(orderId: string, merchantId: string) {
	const order = await db.query.orders.findFirst({
		where: eq(orders.id, orderId),
		with: {
			store: {
				columns: {
					id: true,
					merchantId: true,
					currency: true,
				},
			},
		},
	});

	if (!order) {
		throw new NotFoundError("Order", orderId);
	}

	// Verify order belongs to merchant's store
	if (order.store.merchantId !== merchantId) {
		throw new NotFoundError("Order", orderId);
	}

	return order;
}

/**
 * Format amount for Mollie API.
 * Mollie requires amount as a string with 2 decimal places.
 */
function formatMollieAmount(
	amountInCents: number,
	currency: string,
): { value: string; currency: string } {
	return {
		value: (amountInCents / 100).toFixed(2),
		currency: currency.toUpperCase(),
	};
}

// ============================================================================
// SERVER FUNCTIONS
// ============================================================================

/**
 * Create a Mollie refund for an order.
 *
 * Supports both full and partial refunds:
 * - Full refund: Omit amount parameter
 * - Partial refund: Specify amount in cents
 *
 * Uses the merchant's stored OAuth tokens for M2M API access.
 */
export const createMollieRefund = createServerFn({ method: "POST" })
	.inputValidator(createMollieRefundSchema)
	.middleware([withAuth])
	.handler(async ({ context, data }) => {
		const { merchantId } = context.auth;

		mollieLogger.info(
			{
				orderId: data.orderId,
				merchantId,
				amount: data.amount,
			},
			"Creating Mollie refund",
		);

		// Find and validate order
		const order = await findOrderForRefund(data.orderId, merchantId);

		// Validate order has a Mollie payment
		if (!order.molliePaymentId) {
			throw new OrderNotRefundableError(
				data.orderId,
				"No Mollie payment found for this order",
			);
		}

		// Validate payment status allows refund
		if (order.paymentStatus !== "paid") {
			throw new OrderNotRefundableError(
				data.orderId,
				`Order payment status is '${order.paymentStatus}', must be 'paid' to refund`,
			);
		}

		// Validate refund amount if partial
		if (data.amount && data.amount > order.totalAmount) {
			throw new RefundAmountExceedsPaymentError(
				data.orderId,
				data.amount,
				order.totalAmount,
			);
		}

		try {
			// Get Mollie client with merchant's OAuth tokens (auto-refreshes if needed)
			const mollieClient = await getMerchantMollieClient(merchantId);

			// Determine refund amount - use requested amount or full order amount
			const refundAmount = data.amount ?? order.totalAmount;

			// Build refund request - Mollie requires amount to be present
			const refundParams = {
				paymentId: order.molliePaymentId,
				amount: formatMollieAmount(refundAmount, order.store.currency),
				description: data.description ?? `Refund for order #${order.id}`,
				metadata: {
					orderId: String(order.id),
					storeId: String(order.storeId),
					merchantId: String(merchantId),
				},
			};

			// Create refund via Mollie API
			const refund = await mollieClient.paymentRefunds.create(refundParams);

			mollieLogger.info(
				{
					orderId: order.id,
					refundId: refund.id,
					status: refund.status,
					amount: refund.amount,
				},
				"Mollie refund created",
			);

			// Determine if this is a full or partial refund
			const isFullRefund = !data.amount || data.amount >= order.totalAmount;
			const newPaymentStatus = isFullRefund ? "refunded" : "refunded";

			// Update order payment status
			// Note: We set to "refunded" immediately for UX, but webhook will confirm
			await db
				.update(orders)
				.set({
					paymentStatus: newPaymentStatus,
				})
				.where(eq(orders.id, data.orderId));

			return {
				refundId: refund.id,
				status: refund.status,
				amount: refund.amount,
				isFullRefund,
			};
		} catch (error) {
			mollieLogger.error(
				{
					orderId: data.orderId,
					merchantId,
					error: error instanceof Error ? error.message : String(error),
				},
				"Failed to create Mollie refund",
			);

			// Re-throw known errors
			if (
				error instanceof OrderNotRefundableError ||
				error instanceof RefundAmountExceedsPaymentError
			) {
				throw error;
			}

			throw new Error(
				`Failed to create refund: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	});

/**
 * Get the status of a Mollie refund.
 * Queries Mollie API directly for current refund status.
 */
export const getMollieRefundStatus = createServerFn({ method: "GET" })
	.inputValidator(getMollieRefundStatusSchema)
	.middleware([withAuth])
	.handler(async ({ context, data }) => {
		const { merchantId } = context.auth;

		// Find and validate order
		const order = await findOrderForRefund(data.orderId, merchantId);

		if (!order.molliePaymentId) {
			throw new OrderNotRefundableError(
				data.orderId,
				"No Mollie payment found for this order",
			);
		}

		try {
			// Get Mollie client with merchant's OAuth tokens
			const mollieClient = await getMerchantMollieClient(merchantId);

			// Get refund status from Mollie
			const refund = await mollieClient.paymentRefunds.get(data.refundId, {
				paymentId: order.molliePaymentId,
			});

			return {
				refundId: refund.id,
				status: refund.status,
				amount: refund.amount,
				createdAt: refund.createdAt,
			};
		} catch (error) {
			mollieLogger.error(
				{
					orderId: data.orderId,
					refundId: data.refundId,
					error: error instanceof Error ? error.message : String(error),
				},
				"Failed to get Mollie refund status",
			);

			throw new Error(
				`Failed to get refund status: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	});
