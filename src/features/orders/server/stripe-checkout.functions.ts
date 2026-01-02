/**
 * Stripe Checkout server functions for order payments.
 *
 * Flow:
 * 1. Create order with status "awaiting_payment"
 * 2. Call createCheckoutSession to get Stripe Checkout URL
 * 3. Redirect customer to Stripe Checkout
 * 4. Stripe webhook confirms payment -> Order status "confirmed"
 *
 * Supports Stripe Connect:
 * - Merchants with connected accounts get payments on their account
 * - Platform takes application fee percentage
 */

import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { stripeLogger } from "@/lib/logger";
import { getStripeClient } from "@/lib/stripe";

// ============================================================================
// SCHEMAS
// ============================================================================

const createCheckoutSessionSchema = z.object({
	orderId: z.number().int().positive(),
	successUrl: z.string().url(),
	cancelUrl: z.string().url(),
});

const getCheckoutSessionSchema = z.object({
	sessionId: z.string().min(1),
});

const expireCheckoutSessionSchema = z.object({
	orderId: z.number().int().positive(),
});

// ============================================================================
// TYPES
// ============================================================================

export type CreateCheckoutSessionInput = z.infer<
	typeof createCheckoutSessionSchema
>;
export type GetCheckoutSessionInput = z.infer<typeof getCheckoutSessionSchema>;
export type ExpireCheckoutSessionInput = z.infer<
	typeof expireCheckoutSessionSchema
>;

// ============================================================================
// CONSTANTS
// ============================================================================

/** Platform fee percentage (5%) */
const PLATFORM_FEE_PERCENT = 0.05;

/** Checkout session expiration time in seconds (30 minutes) */
const CHECKOUT_EXPIRATION_SECONDS = 30 * 60;

// ============================================================================
// SERVER FUNCTIONS
// ============================================================================

/**
 * Create a Stripe Checkout session for an order.
 * Returns the checkout URL for customer redirect.
 *
 * Supports Stripe Connect:
 * - If merchant has a connected account, creates session on their account
 * - Platform takes application fee
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
	.inputValidator(createCheckoutSessionSchema)
	.handler(async ({ data }) => {
		// Get order with items, store, and merchant info
		const order = await db.query.orders.findFirst({
			where: eq(orders.id, data.orderId),
			with: {
				items: {
					with: {
						options: true,
					},
				},
				store: {
					columns: {
						name: true,
						currency: true,
					},
					with: {
						merchant: {
							columns: {
								paymentAccountId: true,
							},
						},
					},
				},
			},
		});

		if (!order) {
			throw new Error("Order not found");
		}

		if (order.status !== "awaiting_payment") {
			throw new Error("Order is not awaiting payment");
		}

		if (order.paymentStatus !== "pending") {
			throw new Error("Payment already initiated for this order");
		}

		const stripe = getStripeClient();
		const currency = order.store.currency.toLowerCase();

		// Build line items from order items
		const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
			order.items.map((item, index) => {
				// Build description with selected options
				const optionsList = item.options
					.map(
						(opt) =>
							`${opt.choiceName}${opt.quantity > 1 ? ` x${opt.quantity}` : ""}`,
					)
					.join(", ");

				const description =
					optionsList || item.description || `Item ${index + 1}`;

				return {
					price_data: {
						currency,
						product_data: {
							name: item.name,
							// Stripe description limit is 500 characters
							description: description.slice(0, 500),
						},
						// Price per unit including options
						unit_amount: item.unitPrice + item.optionsPrice,
					},
					quantity: item.quantity,
				};
			});

		// Add tip as separate line item if present
		if (order.tipAmount > 0) {
			lineItems.push({
				price_data: {
					currency,
					product_data: {
						name: "Tip",
					},
					unit_amount: order.tipAmount,
				},
				quantity: 1,
			});
		}

		// Build checkout session parameters
		const sessionParams: Stripe.Checkout.SessionCreateParams = {
			mode: "payment",
			line_items: lineItems,
			success_url: `${data.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: data.cancelUrl,
			metadata: {
				orderId: order.id.toString(),
				storeId: order.storeId.toString(),
			},
			customer_email: order.customerEmail || undefined,
			// Expires in 30 minutes
			expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRATION_SECONDS,
		};

		// Create session - on connected account if merchant has one
		let session: Stripe.Checkout.Session;
		const merchantAccountId = order.store.merchant?.paymentAccountId;

		if (merchantAccountId) {
			// Connected account - platform takes application fee
			const applicationFeeAmount = Math.round(
				order.totalAmount * PLATFORM_FEE_PERCENT,
			);

			session = await stripe.checkout.sessions.create(
				{
					...sessionParams,
					payment_intent_data: {
						application_fee_amount: applicationFeeAmount,
					},
				},
				{
					stripeAccount: merchantAccountId,
				},
			);
		} else {
			// Platform account (for testing or merchants without Connect)
			session = await stripe.checkout.sessions.create(sessionParams);
		}

		// Update order with session ID
		await db
			.update(orders)
			.set({
				stripeCheckoutSessionId: session.id,
				paymentStatus: "awaiting_confirmation",
			})
			.where(eq(orders.id, data.orderId));

		return {
			sessionId: session.id,
			url: session.url,
		};
	});

/**
 * Get checkout session status.
 * Used for polling or verifying status after redirect.
 */
export const getCheckoutSessionStatus = createServerFn({ method: "GET" })
	.inputValidator(getCheckoutSessionSchema)
	.handler(async ({ data }) => {
		// Find order by checkout session ID
		const order = await db.query.orders.findFirst({
			where: eq(orders.stripeCheckoutSessionId, data.sessionId),
			columns: {
				id: true,
				status: true,
				paymentStatus: true,
			},
		});

		if (!order) {
			throw new Error("Order not found for session");
		}

		return {
			orderId: order.id,
			orderStatus: order.status,
			paymentStatus: order.paymentStatus,
		};
	});

/**
 * Expire a checkout session when customer cancels.
 * Expires the Stripe session and updates order status.
 */
export const expireCheckoutSession = createServerFn({ method: "POST" })
	.inputValidator(expireCheckoutSessionSchema)
	.handler(async ({ data }) => {
		const order = await db.query.orders.findFirst({
			where: eq(orders.id, data.orderId),
			with: {
				store: {
					with: {
						merchant: {
							columns: {
								paymentAccountId: true,
							},
						},
					},
				},
			},
		});

		if (!order) {
			throw new Error("Order not found");
		}

		if (!order.stripeCheckoutSessionId) {
			throw new Error("No checkout session found");
		}

		if (order.paymentStatus !== "awaiting_confirmation") {
			throw new Error("Cannot expire session - payment not pending");
		}

		const stripe = getStripeClient();
		const merchantAccountId = order.store.merchant?.paymentAccountId;

		// Expire the Stripe session (may already be expired)
		try {
			if (merchantAccountId) {
				await stripe.checkout.sessions.expire(order.stripeCheckoutSessionId, {
					stripeAccount: merchantAccountId,
				});
			} else {
				await stripe.checkout.sessions.expire(order.stripeCheckoutSessionId);
			}
		} catch (error) {
			// Session might already be expired - log but continue
			stripeLogger.warn({ error }, "Error expiring session");
		}

		// Update order status
		const [updatedOrder] = await db
			.update(orders)
			.set({
				status: "cancelled",
				paymentStatus: "expired",
			})
			.where(eq(orders.id, data.orderId))
			.returning();

		return updatedOrder;
	});
