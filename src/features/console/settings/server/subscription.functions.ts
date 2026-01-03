import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { merchants } from "@/db/schema.ts";
import { env } from "@/env";
import { withAuth } from "@/features/console/auth/server/auth-middleware";
import { stripeLogger } from "@/lib/logger";
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
