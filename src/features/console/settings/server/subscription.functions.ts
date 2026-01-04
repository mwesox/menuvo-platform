import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { merchants } from "@/db/schema.ts";
import { env } from "@/env";
import { withAuth } from "@/features/console/auth/server/auth-middleware";
import { mollieLogger, stripeLogger } from "@/lib/logger";
import { getMollieClient } from "@/lib/mollie/client";
import {
	cancelSubscription as cancelMollieSubscriptionApi,
	createFirstPaymentForMandate,
	getSubscription as getMollieSubscriptionApi,
} from "@/lib/mollie/subscriptions";
import {
	cancelSubscription,
	createBillingPortalSession,
	createSubscriptionCheckout,
	getSubscription,
	resumeSubscription,
} from "@/lib/stripe/subscriptions";
import type { PlanTier } from "../schemas";
import { planTiers } from "../schemas";

/**
 * Get subscription details for a merchant.
 * Fetches from database and enriches with Stripe data.
 */
export const getSubscriptionDetails = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { merchantId } = context.auth;
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				id: true,
				subscriptionStatus: true,
				subscriptionId: true,
				subscriptionPriceId: true,
				subscriptionTrialEndsAt: true,
				subscriptionCurrentPeriodEnd: true,
				paymentAccountId: true,
			},
		});

		if (!merchant) {
			throw new Error("Merchant not found");
		}

		// Fetch latest from Stripe if we have a subscription
		let cancelAtPeriodEnd = false;
		let stripeStatus: string | null = null;

		if (merchant.subscriptionId) {
			try {
				const stripeSubscription = await getSubscription(
					merchant.subscriptionId,
				);
				cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end;
				stripeStatus = stripeSubscription.status;
			} catch (err) {
				stripeLogger.error(
					{ subscriptionId: merchant.subscriptionId, error: err },
					"Failed to fetch Stripe subscription",
				);
			}
		}

		// Determine current plan tier from price ID
		const currentPlan = getPlanTierFromPriceId(merchant.subscriptionPriceId);

		return {
			...merchant,
			currentPlan,
			cancelAtPeriodEnd,
			stripeStatus,
		};
	});

// Schema for changeSubscriptionPlan (no longer needs merchantId)
const changePlanInputSchema = z.object({
	priceId: z.string().min(1, "Price ID is required"),
	newPlan: z.enum(planTiers),
});

/**
 * Change subscription plan (upgrade/downgrade).
 * Creates a Stripe Checkout session for the new plan.
 */
export const changeSubscriptionPlan = createServerFn({ method: "POST" })
	.inputValidator(changePlanInputSchema)
	.middleware([withAuth])
	.handler(async ({ context, data }) => {
		const { merchantId } = context.auth;
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				paymentAccountId: true,
				subscriptionId: true,
				subscriptionStatus: true,
			},
		});

		if (!merchant) {
			throw new Error("Merchant not found");
		}

		if (!merchant.paymentAccountId) {
			throw new Error("Merchant has no payment account");
		}

		// Create checkout session for the new plan
		// Stripe handles proration automatically
		const serverUrl = env.SERVER_URL || "http://localhost:3000";
		const session = await createSubscriptionCheckout({
			accountId: merchant.paymentAccountId,
			priceId: data.priceId,
			successUrl: `${serverUrl}/console/settings/merchant?tab=subscription&success=true`,
			cancelUrl: `${serverUrl}/console/settings/merchant?tab=subscription&canceled=true`,
			metadata: {
				merchantId: String(merchantId),
				action: "plan_change",
				newPlan: data.newPlan,
			},
		});

		return { checkoutUrl: session.url };
	});

// Schema for cancelMerchantSubscription (no longer needs merchantId)
const cancelSubscriptionInputSchema = z.object({
	immediately: z.boolean().default(false),
});

/**
 * Cancel merchant subscription.
 * By default cancels at period end, but can be immediate.
 */
export const cancelMerchantSubscription = createServerFn({ method: "POST" })
	.inputValidator(cancelSubscriptionInputSchema)
	.middleware([withAuth])
	.handler(async ({ context, data }) => {
		const { merchantId } = context.auth;
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: { subscriptionId: true },
		});

		if (!merchant?.subscriptionId) {
			throw new Error("No active subscription found");
		}

		const subscription = await cancelSubscription(
			merchant.subscriptionId,
			!data.immediately, // atPeriodEnd = opposite of immediately
		);

		return {
			success: true,
			cancelAtPeriodEnd: subscription.cancel_at_period_end,
		};
	});

/**
 * Resume a paused subscription.
 * Called after merchant adds a payment method.
 */
export const resumeMerchantSubscription = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { merchantId } = context.auth;
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: { subscriptionId: true },
		});

		if (!merchant?.subscriptionId) {
			throw new Error("No subscription found to resume");
		}

		await resumeSubscription(merchant.subscriptionId);

		return { success: true };
	});

/**
 * Create a Stripe Billing Portal session.
 * Allows merchant to manage payment methods, view invoices, etc.
 */
export const createMerchantBillingPortal = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { merchantId } = context.auth;
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: { paymentAccountId: true },
		});

		if (!merchant?.paymentAccountId) {
			throw new Error("Merchant has no payment account");
		}

		const serverUrl = env.SERVER_URL || "http://localhost:3000";
		const session = await createBillingPortalSession({
			accountId: merchant.paymentAccountId,
			returnUrl: `${serverUrl}/console/settings/merchant?tab=subscription`,
		});

		return { url: session.url };
	});

/**
 * Get price ID for a plan tier from environment variables.
 */
export const getPriceIdForPlan = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({ plan: z.enum(["starter", "professional", "max"]) }),
	)
	.handler(({ data }) => {
		const priceIds: Record<string, string | undefined> = {
			starter: env.STRIPE_PRICE_STARTER,
			professional: env.STRIPE_PRICE_PRO,
			max: env.STRIPE_PRICE_MAX,
		};

		const priceId = priceIds[data.plan];
		if (!priceId) {
			throw new Error(`Price ID not configured for plan: ${data.plan}`);
		}

		return { priceId };
	});

/**
 * Helper function to determine plan tier from price ID.
 */
function getPlanTierFromPriceId(priceId: string | null): PlanTier | null {
	if (!priceId) return null;
	if (priceId === env.STRIPE_PRICE_STARTER) return "starter";
	if (priceId === env.STRIPE_PRICE_PRO) return "professional";
	if (priceId === env.STRIPE_PRICE_MAX) return "max";
	return null;
}

// ============================================================================
// MOLLIE SUBSCRIPTION FUNCTIONS
// ============================================================================

/**
 * Get Mollie price for a plan tier from environment variables.
 * Returns amount in EUR format (e.g., "29.00").
 */
function getMolliePriceForPlan(plan: PlanTier): string {
	const prices: Record<PlanTier, string | undefined> = {
		starter: env.MOLLIE_PRICE_STARTER,
		professional: env.MOLLIE_PRICE_PRO,
		max: env.MOLLIE_PRICE_MAX,
	};

	const price = prices[plan];
	if (!price) {
		throw new Error(`Mollie price not configured for plan: ${plan}`);
	}
	return price;
}

// Schema for createMollieSubscriptionPayment
const createMollieSubscriptionInputSchema = z.object({
	plan: z.enum(planTiers),
});

/**
 * Create first payment to establish a mandate for Mollie subscription.
 *
 * Mollie subscription flow:
 * 1. Create first payment with sequenceType: "first" -> this creates the mandate
 * 2. Customer is redirected to Mollie checkout page
 * 3. Payment webhook confirms payment -> mandate becomes "valid"
 * 4. Webhook handler creates actual subscription using the valid mandate
 *
 * The customer is charged the first month immediately, then recurring monthly.
 */
export const createMollieSubscriptionPayment = createServerFn({
	method: "POST",
})
	.inputValidator(createMollieSubscriptionInputSchema)
	.middleware([withAuth])
	.handler(async ({ context, data }) => {
		const { merchantId } = context.auth;

		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				id: true,
				mollieCustomerId: true,
				mollieSubscriptionId: true,
				mollieSubscriptionStatus: true,
			},
		});

		if (!merchant) {
			throw new Error("Merchant not found");
		}

		// Check if already has an active subscription
		if (
			merchant.mollieSubscriptionId &&
			merchant.mollieSubscriptionStatus === "active"
		) {
			throw new Error("Merchant already has an active Mollie subscription");
		}

		// Ensure merchant has a Mollie customer ID
		let customerId = merchant.mollieCustomerId;
		if (!customerId) {
			// Create a Mollie customer for this merchant
			const mollie = getMollieClient();
			const customer = await mollie.customers.create({
				name: `Merchant ${merchantId}`,
				metadata: { merchantId: String(merchantId) },
			});
			customerId = customer.id;

			// Store the customer ID
			await db
				.update(merchants)
				.set({ mollieCustomerId: customerId })
				.where(eq(merchants.id, merchantId));

			mollieLogger.info(
				{ merchantId, customerId },
				"Created Mollie customer for subscription",
			);
		}

		const price = getMolliePriceForPlan(data.plan);
		const serverUrl = env.SERVER_URL || "http://localhost:3000";

		// Create first payment to establish mandate
		const payment = await createFirstPaymentForMandate({
			customerId,
			amount: { value: price, currency: "EUR" },
			description: `Menuvo ${data.plan.charAt(0).toUpperCase() + data.plan.slice(1)} Plan - First Payment`,
			redirectUrl: `${serverUrl}/console/settings/merchant?tab=subscription&mollie_payment=complete`,
			webhookUrl: `${serverUrl}/webhooks/mollie`,
			metadata: {
				merchantId: String(merchantId),
				type: "subscription_first_payment",
				plan: data.plan,
			},
		});

		// Update merchant with pending mandate status
		await db
			.update(merchants)
			.set({
				mollieMandateStatus: "pending",
			})
			.where(eq(merchants.id, merchantId));

		mollieLogger.info(
			{
				merchantId,
				customerId,
				paymentId: payment.id,
				plan: data.plan,
			},
			"Created first payment for Mollie subscription mandate",
		);

		const checkoutUrl = payment._links.checkout?.href;
		if (!checkoutUrl) {
			throw new Error("Failed to get checkout URL from Mollie payment");
		}

		return { checkoutUrl };
	});

/**
 * Get Mollie subscription status for the current merchant.
 * Fetches from database and enriches with live Mollie data if available.
 */
export const getMollieSubscriptionStatus = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { merchantId } = context.auth;

		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				id: true,
				mollieCustomerId: true,
				mollieMandateId: true,
				mollieMandateStatus: true,
				mollieSubscriptionId: true,
				mollieSubscriptionStatus: true,
			},
		});

		if (!merchant) {
			throw new Error("Merchant not found");
		}

		// If no Mollie subscription, return minimal info
		if (!merchant.mollieSubscriptionId) {
			return {
				hasSubscription: false,
				subscriptionId: null,
				status: null,
				mandateId: merchant.mollieMandateId,
				mandateStatus: merchant.mollieMandateStatus,
				nextPaymentDate: null,
				amount: null,
			};
		}

		// Fetch live subscription data from Mollie
		let nextPaymentDate: string | null = null;
		let amount: { value: string; currency: string } | null = null;
		let liveStatus: string | null = null;

		if (merchant.mollieCustomerId && merchant.mollieSubscriptionId) {
			try {
				const subscription = await getMollieSubscriptionApi(
					merchant.mollieCustomerId,
					merchant.mollieSubscriptionId,
				);
				nextPaymentDate = subscription.nextPaymentDate ?? null;
				amount = subscription.amount;
				liveStatus = subscription.status;
			} catch (error) {
				mollieLogger.error(
					{
						merchantId,
						subscriptionId: merchant.mollieSubscriptionId,
						error: error instanceof Error ? error.message : String(error),
					},
					"Failed to fetch Mollie subscription status",
				);
			}
		}

		return {
			hasSubscription: true,
			subscriptionId: merchant.mollieSubscriptionId,
			status: liveStatus ?? merchant.mollieSubscriptionStatus,
			mandateId: merchant.mollieMandateId,
			mandateStatus: merchant.mollieMandateStatus,
			nextPaymentDate,
			amount,
		};
	});

/**
 * Cancel Mollie subscription for the current merchant.
 * Cancellation takes effect immediately. No more payments will be collected.
 * Already collected payments are not refunded.
 */
export const cancelMollieSubscription = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { merchantId } = context.auth;

		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				id: true,
				mollieCustomerId: true,
				mollieSubscriptionId: true,
				mollieSubscriptionStatus: true,
			},
		});

		if (!merchant) {
			throw new Error("Merchant not found");
		}

		if (!merchant.mollieCustomerId || !merchant.mollieSubscriptionId) {
			throw new Error("No active Mollie subscription found");
		}

		if (merchant.mollieSubscriptionStatus === "canceled") {
			throw new Error("Subscription is already canceled");
		}

		// Cancel the subscription via Mollie API
		const canceledSubscription = await cancelMollieSubscriptionApi(
			merchant.mollieCustomerId,
			merchant.mollieSubscriptionId,
		);

		// Update merchant subscription status
		await db
			.update(merchants)
			.set({
				mollieSubscriptionStatus: "canceled",
			})
			.where(eq(merchants.id, merchantId));

		mollieLogger.info(
			{
				merchantId,
				subscriptionId: merchant.mollieSubscriptionId,
			},
			"Mollie subscription canceled",
		);

		return {
			success: true,
			status: canceledSubscription.status,
		};
	});
