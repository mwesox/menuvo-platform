"use server";

/**
 * Stripe Checkout server functions for order payments.
 *
 * Flow (Embedded Checkout):
 * 1. Create order with status "awaiting_payment"
 * 2. Call createCheckoutSession to get clientSecret
 * 3. Render embedded Stripe Checkout on the page
 * 4. Customer completes payment in iframe
 * 5. Stripe webhook confirms payment -> Order status "confirmed"
 * 6. Return page shows success
 *
 * Supports Stripe Connect:
 * - Merchants with connected accounts get payments on their account
 * - Platform takes application fee percentage
 */

import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { z } from "zod";
import { config } from "@/config";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { DatabaseError, NotFoundError } from "@/lib/errors";
import { stripeLogger } from "@/lib/logger";
import { getStripeClient } from "@/lib/stripe";
import {
	NoCheckoutSessionError,
	OrderNotAwaitingPaymentError,
	PaymentAlreadyInitiatedError,
	SessionNotExpirableError,
	StripeOperationError,
} from "../errors";

// ============================================================================
// SCHEMAS
// ============================================================================

const createCheckoutSessionSchema = z.object({
	orderId: z.string().uuid(),
	returnUrl: z.string().url(),
});

const getCheckoutSessionSchema = z.object({
	sessionId: z.string().min(1),
});

const expireCheckoutSessionSchema = z.object({
	orderId: z.string().uuid(),
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

/** Checkout session expiration time in seconds (30 minutes) */
const CHECKOUT_EXPIRATION_SECONDS = 30 * 60;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function findOrderWithPaymentDetails(orderId: string) {
	try {
		const order = await db.query.orders.findFirst({
			where: eq(orders.id, orderId),
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
								paymentCapabilitiesStatus: true,
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
								paymentAccountId: true,
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

// ============================================================================
// SERVER FUNCTIONS
// ============================================================================

/**
 * Create an embedded Stripe Checkout session for an order.
 * Returns the clientSecret for rendering the embedded checkout component.
 *
 * Supports Stripe Connect:
 * - If merchant has a connected account, creates session on their account
 * - Platform takes application fee (5%)
 * - Returns merchantAccountId for frontend Stripe initialization
 */
export const createCheckoutSession = createServerFn({ method: "POST" })
	.inputValidator(createCheckoutSessionSchema)
	.handler(async ({ data }) => {
		const order = await findOrderWithPaymentDetails(data.orderId);

		// Validate order state
		if (order.status !== "awaiting_payment") {
			throw new OrderNotAwaitingPaymentError(order.status, order.paymentStatus);
		}

		if (order.paymentStatus !== "pending") {
			throw new PaymentAlreadyInitiatedError(order.id, order.paymentStatus);
		}

		// Validate merchant can accept online payments (defense in depth)
		if (order.store.merchant?.paymentCapabilitiesStatus !== "active") {
			throw new Error("Online payment is currently unavailable");
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

		// Build checkout session parameters for embedded mode
		const sessionParams: Stripe.Checkout.SessionCreateParams = {
			mode: "payment",
			ui_mode: "embedded",
			line_items: lineItems,
			return_url: `${data.returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
			metadata: {
				orderId: order.id,
				storeId: order.storeId,
			},
			customer_email: order.customerEmail || undefined,
			// Expires in 30 minutes
			expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRATION_SECONDS,
		};

		// Create session - on connected account if merchant has one
		const merchantAccountId = order.store.merchant?.paymentAccountId;

		let session: Stripe.Checkout.Session;
		try {
			if (merchantAccountId) {
				// Connected account - platform takes application fee
				const applicationFeeAmount = Math.round(
					order.totalAmount * config.platformFeePercent,
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
		} catch (error) {
			throw new StripeOperationError(
				"createSession",
				error instanceof Error ? error.message : undefined,
			);
		}

		// Update order with session ID
		try {
			await db
				.update(orders)
				.set({
					stripeCheckoutSessionId: session.id,
					paymentStatus: "awaiting_confirmation",
				})
				.where(eq(orders.id, data.orderId));
		} catch (_error) {
			throw new DatabaseError("updateOrderWithSession");
		}

		return {
			sessionId: session.id,
			clientSecret: session.client_secret,
			merchantAccountId: merchantAccountId ?? null,
		};
	});

/**
 * Get checkout session status.
 * Queries Stripe API directly for instant confirmation (no webhook dependency).
 */
export const getCheckoutSessionStatus = createServerFn({ method: "GET" })
	.inputValidator(getCheckoutSessionSchema)
	.handler(async ({ data }) => {
		// Find order with merchant info for Stripe Connect
		const order = await db.query.orders.findFirst({
			where: eq(orders.stripeCheckoutSessionId, data.sessionId),
			columns: {
				id: true,
				status: true,
				paymentStatus: true,
			},
			with: {
				store: {
					with: {
						merchant: {
							columns: { paymentAccountId: true },
						},
					},
				},
			},
		});

		if (!order) {
			throw new NotFoundError("Order", data.sessionId);
		}

		// Query Stripe directly for instant confirmation
		const stripe = getStripeClient();
		const merchantAccountId = order.store?.merchant?.paymentAccountId;

		const session = merchantAccountId
			? await stripe.checkout.sessions.retrieve(data.sessionId, {
					stripeAccount: merchantAccountId,
				})
			: await stripe.checkout.sessions.retrieve(data.sessionId);

		// Update DB based on Stripe status
		if (session.status === "complete" && session.payment_status === "paid") {
			if (order.paymentStatus !== "paid") {
				await db
					.update(orders)
					.set({
						status: "confirmed",
						paymentStatus: "paid",
						confirmedAt: new Date(),
					})
					.where(eq(orders.id, order.id));
			}
			return {
				orderId: order.id,
				orderStatus: "confirmed" as const,
				paymentStatus: "paid" as const,
			};
		}

		if (session.status === "expired") {
			if (order.paymentStatus !== "expired") {
				await db
					.update(orders)
					.set({
						status: "cancelled",
						paymentStatus: "expired",
					})
					.where(eq(orders.id, order.id));
			}
			return {
				orderId: order.id,
				orderStatus: "cancelled" as const,
				paymentStatus: "expired" as const,
			};
		}

		// Still pending
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
		const order = await findOrderById(data.orderId);

		// Validate checkout session exists
		if (!order.stripeCheckoutSessionId) {
			throw new NoCheckoutSessionError(order.id);
		}

		// Validate payment is pending
		if (order.paymentStatus !== "awaiting_confirmation") {
			throw new SessionNotExpirableError(order.paymentStatus);
		}

		const stripe = getStripeClient();
		const merchantAccountId = order.store.merchant?.paymentAccountId;

		// Expire the Stripe session (may already be expired)
		// We use non-null assertion since we validated above
		const sessionId = order.stripeCheckoutSessionId as string;

		try {
			if (merchantAccountId) {
				await stripe.checkout.sessions.expire(sessionId, {
					stripeAccount: merchantAccountId,
				});
			} else {
				await stripe.checkout.sessions.expire(sessionId);
			}
		} catch (error) {
			// Session might already be expired - log but continue
			stripeLogger.warn({ error }, "Error expiring session");
		}

		// Update order status
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
			throw new DatabaseError("updateOrderExpired");
		}
	});
