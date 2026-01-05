/**
 * Mollie Checkout server functions for order payments.
 *
 * Flow (Redirect Checkout):
 * 1. Create order with status "awaiting_payment"
 * 2. Call createMolliePayment to get checkoutUrl
 * 3. Redirect customer to Mollie hosted checkout page
 * 4. Customer completes payment on Mollie's page
 * 5. Customer redirects back to return URL
 * 6. Mollie webhook confirms payment -> Order status "confirmed"
 *
 * Supports Mollie Connect:
 * - Merchants with connected accounts get payments on their account
 * - Platform takes application fee (5%)
 */

import type { Payment } from "@mollie/api-client";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
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
	MOLLIE_CONFIG,
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

const createMolliePaymentSchema = z.object({
	orderId: z.number().int().positive(),
	returnUrl: z.string().url(),
});

const getMolliePaymentStatusSchema = z.object({
	paymentId: z.string().min(1),
});

const cancelMolliePaymentSchema = z.object({
	orderId: z.number().int().positive(),
});

// ============================================================================
// TYPES
// ============================================================================

export type CreateMolliePaymentInput = z.infer<
	typeof createMolliePaymentSchema
>;
export type GetMolliePaymentStatusInput = z.infer<
	typeof getMolliePaymentStatusSchema
>;
export type CancelMolliePaymentInput = z.infer<
	typeof cancelMolliePaymentSchema
>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function findOrderWithMollieDetails(orderId: number) {
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
		throw new DatabaseError("findOrderWithMollieDetails");
	}
}

async function findOrderById(orderId: number) {
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
 * Create a Mollie payment for an order.
 * Returns the checkoutUrl for redirecting the customer.
 *
 * Supports Mollie Connect:
 * - If merchant has a connected account, creates payment via their profile
 * - Platform takes application fee (5%)
 */
export const createMolliePayment = createServerFn({ method: "POST" })
	.inputValidator(createMolliePaymentSchema)
	.handler(async ({ data }) => {
		const order = await findOrderWithMollieDetails(data.orderId);

		// Validate order state
		if (order.status !== "awaiting_payment") {
			throw new OrderNotAwaitingPaymentError(order.status, order.paymentStatus);
		}

		if (order.paymentStatus !== "pending") {
			throw new PaymentAlreadyInitiatedError(order.id, order.paymentStatus);
		}

		// Validate merchant can accept Mollie payments
		const merchant = order.store.merchant;
		const caps = computeMerchantCapabilities({
			mollieCanReceivePayments: merchant?.mollieCanReceivePayments ?? null,
		});
		if (!caps.canAcceptOnlinePayment) {
			throw new Error("Mollie payment is currently unavailable for this store");
		}

		const currency = order.store.currency.toUpperCase();
		const amount = formatMollieAmount(order.totalAmount, currency);

		// Build description
		const itemCount = order.items.length;
		const description = `Order #${order.id} - ${order.store.name} (${itemCount} item${itemCount > 1 ? "s" : ""})`;

		// Build webhook URL - Mollie sends webhooks to this endpoint
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
					order.totalAmount * MOLLIE_CONFIG.PLATFORM_FEE_PERCENT,
				);

				const testMode = isTestMode();
				const payment = await merchantClient.payments.create({
					amount,
					description,
					redirectUrl: returnUrl,
					webhookUrl,
					profileId: merchant.mollieProfileId,
					metadata: {
						orderId: String(order.id),
						storeId: String(order.storeId),
						merchantId: String(merchant.id),
					},
					applicationFee: {
						amount: formatMollieAmount(applicationFeeAmount, currency),
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
					"Created Mollie payment on merchant account",
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
					"Created Mollie payment on platform account",
				);
			}

			if (!paymentResult.checkoutUrl) {
				throw new Error("Mollie did not return a checkout URL");
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
				"Failed to create Mollie payment",
			);
			throw new Error(
				`Failed to create payment: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	});

/**
 * Get Mollie payment status.
 * Queries Mollie API directly for instant confirmation (no webhook dependency).
 * Used on return page to show payment result immediately.
 */
export const getMolliePaymentStatus = createServerFn({ method: "GET" })
	.inputValidator(getMolliePaymentStatusSchema)
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

		// Query Mollie directly for instant confirmation
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
		} catch (error) {
			mollieLogger.error(
				{ paymentId: data.paymentId, error },
				"Failed to fetch Mollie payment status",
			);
			// Return current DB status if Mollie API fails
			return {
				orderId: order.id,
				orderStatus: order.status,
				paymentStatus: order.paymentStatus,
			};
		}

		// Map Mollie status to our order/payment statuses
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
 * Cancel a Mollie payment when customer abandons checkout.
 * Mollie payments can't be force-expired like Stripe, so we just update our status.
 * The payment will naturally expire on Mollie's side.
 */
export const cancelMolliePayment = createServerFn({ method: "POST" })
	.inputValidator(cancelMolliePaymentSchema)
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
			"Cancelling Mollie payment",
		);

		// Update order status - payment will expire on Mollie's side
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
