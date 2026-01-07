"use server";

/**
 * Payment server functions for order payments.
 *
 * Flow (Redirect Checkout):
 * 1. Create order with status "awaiting_payment"
 * 2. Call createPayment to get checkoutUrl
 * 3. Redirect customer to hosted checkout page
 * 4. Customer completes payment
 * 5. Customer redirects back to return URL
 * 6. Webhook confirms payment -> Order status "confirmed"
 *
 * Implementation uses Mollie Connect:
 * - Merchants with connected accounts get payments on their account
 * - Platform takes application fee (5%)
 */

import type { Payment } from "@mollie/api-client";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { config } from "@/config";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { computeMerchantCapabilities } from "@/lib/capabilities";
import { DatabaseError, NotFoundError } from "@/lib/errors";
import { mollieLogger } from "@/lib/logger";
import {
	createOrderPayment,
	getMerchantMollieClient,
	getPayment,
	getWebhookUrl,
	isTestMode,
	mapMolliePaymentStatus,
} from "@/lib/mollie";

import {
	NoCheckoutSessionError,
	OrderNotAwaitingPaymentError,
	PaymentAlreadyInitiatedError,
} from "../errors";

// ============================================================================
// SCHEMAS
// ============================================================================

const createPaymentSchema = z.object({
	orderId: z.string().uuid(),
	returnUrl: z.string().url(),
});

const getPaymentStatusSchema = z.object({
	paymentId: z.string().min(1),
});

const cancelPaymentSchema = z.object({
	orderId: z.string().uuid(),
});

// ============================================================================
// TYPES
// ============================================================================

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type GetPaymentStatusInput = z.infer<typeof getPaymentStatusSchema>;
export type CancelPaymentInput = z.infer<typeof cancelPaymentSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function findOrderWithPaymentDetails(orderId: string) {
	try {
		const order = await db.query.orders.findFirst({
			where: eq(orders.id, orderId),
			with: {
				items: true, // Only need count for description
				store: {
					columns: {
						name: true,
						currency: true,
						slug: true,
					},
					with: {
						merchant: {
							columns: {
								id: true,
								mollieProfileId: true,
								mollieAccessToken: true,
								mollieCanReceivePayments: true,
								paymentProvider: true,
							},
						},
					},
				},
			},
		});

		if (!order) {
			throw new NotFoundError("Order", orderId);
		}

		return order;
	} catch (error) {
		if (error instanceof NotFoundError) {
			throw error;
		}
		throw new DatabaseError("findOrderWithPaymentDetails");
	}
}

async function findOrderById(orderId: string) {
	try {
		const order = await db.query.orders.findFirst({
			where: eq(orders.id, orderId),
			with: {
				store: {
					with: {
						merchant: {
							columns: {
								mollieProfileId: true,
								mollieAccessToken: true,
							},
						},
					},
				},
			},
		});

		if (!order) {
			throw new NotFoundError("Order", orderId);
		}

		return order;
	} catch (error) {
		if (error instanceof NotFoundError) {
			throw error;
		}
		throw new DatabaseError("findOrder");
	}
}

/**
 * Format amount for payment provider API.
 * Requires amount as a string with 2 decimal places.
 */
function formatPaymentAmount(
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
 * Create a payment for an order.
 * Returns the checkoutUrl for redirecting the customer.
 *
 * Supports Mollie Connect:
 * - If merchant has a connected account, creates payment via their profile
 * - Platform takes application fee (5%)
 */
export const createPayment = createServerFn({ method: "POST" })
	.inputValidator(createPaymentSchema)
	.handler(async ({ data }) => {
		const order = await findOrderWithPaymentDetails(data.orderId);

		// Validate order state
		if (order.status !== "awaiting_payment") {
			throw new OrderNotAwaitingPaymentError(order.status, order.paymentStatus);
		}

		if (order.paymentStatus !== "pending") {
			throw new PaymentAlreadyInitiatedError(order.id, order.paymentStatus);
		}

		// Validate merchant can accept payments
		const merchant = order.store.merchant;
		const caps = computeMerchantCapabilities({
			mollieCanReceivePayments: merchant?.mollieCanReceivePayments ?? null,
		});
		if (!caps.canAcceptOnlinePayment) {
			throw new Error("Online payment is currently unavailable for this store");
		}

		const currency = order.store.currency.toUpperCase();
		const amount = formatPaymentAmount(order.totalAmount, currency);

		// Build description
		const itemCount = order.items.length;
		const description = `Order #${order.id} - ${order.store.name} (${itemCount} item${itemCount > 1 ? "s" : ""})`;

		// Build webhook URL - payment provider sends webhooks to this endpoint
		const webhookUrl = getWebhookUrl();

		// Build return URL with order ID for status checking
		const returnUrl = `${data.returnUrl}?order_id=${order.id}`;

		try {
			let paymentResult: { paymentId: string; checkoutUrl: string | undefined };

			if (merchant.mollieAccessToken && merchant.mollieProfileId) {
				// Connected merchant - use their access token (decrypted + auto-refreshed)
				const merchantClient = await getMerchantMollieClient(merchant.id);

				// Calculate application fee
				const applicationFeeAmount = Math.round(
					order.totalAmount * config.platformFeePercent,
				);

				const testMode = isTestMode();
				const payment = await merchantClient.payments.create({
					amount,
					description,
					redirectUrl: returnUrl,
					webhookUrl,
					profileId: merchant.mollieProfileId,
					metadata: {
						orderId: order.id,
						storeId: order.storeId,
						merchantId: merchant.id,
					},
					applicationFee: {
						amount: formatPaymentAmount(applicationFeeAmount, currency),
						description: "Menuvo platform fee",
					},
					...(testMode && { testmode: true }),
				});

				paymentResult = {
					paymentId: payment.id,
					checkoutUrl: payment._links.checkout?.href,
				};

				mollieLogger.info(
					{
						orderId: order.id,
						paymentId: payment.id,
						merchantId: merchant.id,
						applicationFee: applicationFeeAmount,
					},
					"Created payment on merchant account",
				);
			} else {
				// Platform account fallback (for testing or merchants without Connect)
				paymentResult = await createOrderPayment({
					orderId: order.id,
					storeId: order.storeId,
					amount,
					description,
					redirectUrl: returnUrl,
					webhookUrl,
				});

				mollieLogger.info(
					{ orderId: order.id, paymentId: paymentResult.paymentId },
					"Created payment on platform account",
				);
			}

			if (!paymentResult.checkoutUrl) {
				throw new Error("Payment provider did not return a checkout URL");
			}

			// Update order with payment ID
			await db
				.update(orders)
				.set({
					molliePaymentId: paymentResult.paymentId,
					mollieCheckoutUrl: paymentResult.checkoutUrl,
					paymentStatus: "awaiting_confirmation",
					orderPaymentProvider: "mollie",
				})
				.where(eq(orders.id, data.orderId));

			return {
				paymentId: paymentResult.paymentId,
				checkoutUrl: paymentResult.checkoutUrl,
			};
		} catch (error) {
			mollieLogger.error(
				{
					orderId: order.id,
					error: error instanceof Error ? error.message : String(error),
				},
				"Failed to create payment",
			);
			throw new Error(
				`Failed to create payment: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	});

/**
 * Get payment status.
 * Queries payment provider API directly for instant confirmation (no webhook dependency).
 * Used on return page to show payment result immediately.
 */
export const getPaymentStatus = createServerFn({ method: "GET" })
	.inputValidator(getPaymentStatusSchema)
	.handler(async ({ data }) => {
		// Find order by payment ID
		const order = await db.query.orders.findFirst({
			where: eq(orders.molliePaymentId, data.paymentId),
			columns: {
				id: true,
				status: true,
				paymentStatus: true,
			},
			with: {
				store: {
					with: {
						merchant: {
							columns: {
								id: true,
								mollieAccessToken: true,
							},
						},
					},
				},
			},
		});

		if (!order) {
			throw new NotFoundError("Order", data.paymentId);
		}

		// Query payment provider directly for instant confirmation
		let payment: Payment;
		try {
			const merchantId = order.store?.merchant?.id;
			if (merchantId) {
				const merchantClient = await getMerchantMollieClient(merchantId);
				const testMode = isTestMode();
				payment = await merchantClient.payments.get(data.paymentId, {
					...(testMode && { testmode: true }),
				});
			} else {
				payment = await getPayment(data.paymentId);
			}

			mollieLogger.info(
				{ paymentId: data.paymentId, mollieStatus: payment.status },
				"Fetched payment status from Mollie",
			);
		} catch (error) {
			mollieLogger.error(
				{ paymentId: data.paymentId, error },
				"Failed to fetch payment status",
			);
			// Return current DB status if API fails
			return {
				orderId: order.id,
				orderStatus: order.status,
				paymentStatus: order.paymentStatus,
			};
		}

		// Map provider status to our order/payment statuses
		const statusMapping = mapMolliePaymentStatus(payment.status);

		if (statusMapping) {
			// Terminal status - update DB if needed
			if (order.paymentStatus !== statusMapping.paymentStatus) {
				await db
					.update(orders)
					.set({
						status: statusMapping.orderStatus,
						paymentStatus: statusMapping.paymentStatus,
						...(statusMapping.paymentStatus === "paid" && {
							confirmedAt: new Date(),
						}),
					})
					.where(eq(orders.id, order.id));
			}
			return {
				orderId: order.id,
				orderStatus: statusMapping.orderStatus,
				paymentStatus: statusMapping.paymentStatus,
			};
		}

		// Still pending (open, pending, authorized)
		return {
			orderId: order.id,
			orderStatus: order.status,
			paymentStatus: order.paymentStatus,
		};
	});

/**
 * Cancel a payment when customer abandons checkout.
 * Payment provider payments can't be force-expired like Stripe, so we just update our status.
 * The payment will naturally expire on the provider's side.
 */
export const cancelPayment = createServerFn({ method: "POST" })
	.inputValidator(cancelPaymentSchema)
	.handler(async ({ data }) => {
		const order = await findOrderById(data.orderId);

		// Validate payment exists
		if (!order.molliePaymentId) {
			throw new NoCheckoutSessionError(order.id);
		}

		// Validate payment is pending
		if (
			order.paymentStatus !== "awaiting_confirmation" &&
			order.paymentStatus !== "pending"
		) {
			// Already completed or failed
			return {
				id: order.id,
				status: order.status,
				paymentStatus: order.paymentStatus,
			};
		}

		mollieLogger.info(
			{ orderId: order.id, paymentId: order.molliePaymentId },
			"Cancelling payment",
		);

		// Update order status - payment will expire on provider's side
		try {
			const result = await db
				.update(orders)
				.set({
					status: "cancelled",
					paymentStatus: "expired",
				})
				.where(eq(orders.id, data.orderId))
				.returning();
			return result[0];
		} catch (_error) {
			throw new DatabaseError("updateOrderCancelled");
		}
	});
