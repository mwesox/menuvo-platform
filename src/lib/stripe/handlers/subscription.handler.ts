import { eq, or } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { merchants, type SubscriptionStatus } from "@/db/schema";
import { stripeLogger } from "@/lib/logger";
import { registerV1Handler } from "./registry";

// ============================================
// Types
// ============================================

/**
 * Stripe subscription with period fields.
 * The Stripe v20 types may not have all properties exposed correctly,
 * so we extend the type with the fields we know exist at runtime.
 */
type SubscriptionWithPeriod = Stripe.Subscription & {
	current_period_end?: number | null;
	trial_end?: number | null;
};

// ============================================
// Helper Functions
// ============================================

/**
 * Find a merchant by subscription ID or payment account ID (customer_account).
 * The subscription.customer field contains the acct_xxx when using customer_account.
 */
async function findMerchantBySubscription(
	subscription: SubscriptionWithPeriod,
): Promise<{ id: number } | null> {
	// Try to find by subscriptionId first, then by paymentAccountId (customer_account)
	const customerAccountId =
		typeof subscription.customer === "string"
			? subscription.customer
			: subscription.customer?.id;

	const result = await db
		.select({ id: merchants.id })
		.from(merchants)
		.where(
			or(
				eq(merchants.subscriptionId, subscription.id),
				customerAccountId
					? eq(merchants.paymentAccountId, customerAccountId)
					: undefined,
			),
		)
		.limit(1);

	return result[0] ?? null;
}

/**
 * Map Stripe subscription status to our enum.
 */
function mapStripeStatus(
	stripeStatus: Stripe.Subscription.Status,
): SubscriptionStatus {
	const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
		trialing: "trialing",
		active: "active",
		paused: "paused",
		past_due: "past_due",
		canceled: "canceled",
		incomplete: "none",
		incomplete_expired: "canceled",
		unpaid: "past_due",
	};

	return statusMap[stripeStatus] ?? "none";
}

// ============================================
// Event Handlers (Self-Registering)
// ============================================

/**
 * Handle customer.subscription.created event.
 *
 * Called when a new subscription is created for a customer_account.
 * Updates the merchant's subscription fields.
 */
registerV1Handler("customer.subscription.created", async (event) => {
	const subscription = event.data.object as SubscriptionWithPeriod;

	stripeLogger.info(
		{ subscriptionId: subscription.id, status: subscription.status },
		"Subscription created",
	);

	const merchant = await findMerchantBySubscription(subscription);

	if (!merchant) {
		// This may happen if the subscription is created before the merchant record
		// (e.g., during onboarding where we create subscription first, then merchant in DB)
		stripeLogger.debug(
			{ subscriptionId: subscription.id },
			"No merchant found for subscription - may be pending onboarding",
		);
		return;
	}

	const status = mapStripeStatus(subscription.status);

	await db
		.update(merchants)
		.set({
			subscriptionId: subscription.id,
			subscriptionStatus: status,
			subscriptionCurrentPeriodEnd: subscription.current_period_end
				? new Date(subscription.current_period_end * 1000)
				: null,
			subscriptionTrialEndsAt: subscription.trial_end
				? new Date(subscription.trial_end * 1000)
				: null,
		})
		.where(eq(merchants.id, merchant.id));

	stripeLogger.info(
		{
			merchantId: merchant.id,
			subscriptionId: subscription.id,
			status,
		},
		"Updated merchant subscription (created)",
	);
});

/**
 * Handle customer.subscription.updated event.
 *
 * Called when a subscription is modified (status change, renewal, etc.).
 * Syncs the subscription status to our merchant record.
 */
registerV1Handler("customer.subscription.updated", async (event) => {
	const subscription = event.data.object as SubscriptionWithPeriod;

	stripeLogger.info(
		{ subscriptionId: subscription.id, status: subscription.status },
		"Subscription updated",
	);

	const merchant = await findMerchantBySubscription(subscription);

	if (!merchant) {
		stripeLogger.debug(
			{ subscriptionId: subscription.id },
			"No merchant found for subscription",
		);
		return;
	}

	const status = mapStripeStatus(subscription.status);

	await db
		.update(merchants)
		.set({
			subscriptionStatus: status,
			subscriptionCurrentPeriodEnd: subscription.current_period_end
				? new Date(subscription.current_period_end * 1000)
				: null,
			subscriptionTrialEndsAt: subscription.trial_end
				? new Date(subscription.trial_end * 1000)
				: null,
		})
		.where(eq(merchants.id, merchant.id));

	stripeLogger.info(
		{
			merchantId: merchant.id,
			subscriptionId: subscription.id,
			status,
		},
		"Updated merchant subscription (updated)",
	);
});

/**
 * Handle customer.subscription.deleted event.
 *
 * Called when a subscription is canceled and reaches the end of its period.
 * Marks the merchant subscription as canceled.
 */
registerV1Handler("customer.subscription.deleted", async (event) => {
	const subscription = event.data.object as SubscriptionWithPeriod;

	stripeLogger.info(
		{ subscriptionId: subscription.id },
		"Subscription deleted",
	);

	const merchant = await findMerchantBySubscription(subscription);

	if (!merchant) {
		stripeLogger.debug(
			{ subscriptionId: subscription.id },
			"No merchant found for subscription",
		);
		return;
	}

	await db
		.update(merchants)
		.set({
			subscriptionStatus: "canceled",
			subscriptionCurrentPeriodEnd: null,
			subscriptionTrialEndsAt: null,
		})
		.where(eq(merchants.id, merchant.id));

	stripeLogger.info(
		{
			merchantId: merchant.id,
			subscriptionId: subscription.id,
		},
		"Marked merchant subscription as canceled",
	);
});

/**
 * Handle customer.subscription.paused event.
 *
 * Called when a subscription is paused (e.g., trial ended without payment method).
 * Restricts merchant access until payment method is added.
 */
registerV1Handler("customer.subscription.paused", async (event) => {
	const subscription = event.data.object as SubscriptionWithPeriod;

	stripeLogger.info({ subscriptionId: subscription.id }, "Subscription paused");

	const merchant = await findMerchantBySubscription(subscription);

	if (!merchant) {
		stripeLogger.debug(
			{ subscriptionId: subscription.id },
			"No merchant found for subscription",
		);
		return;
	}

	await db
		.update(merchants)
		.set({
			subscriptionStatus: "paused",
		})
		.where(eq(merchants.id, merchant.id));

	stripeLogger.info(
		{
			merchantId: merchant.id,
			subscriptionId: subscription.id,
		},
		"Marked merchant subscription as paused",
	);
});

/**
 * Handle customer.subscription.resumed event.
 *
 * Called when a paused subscription is resumed (payment method added).
 * Restores merchant access.
 */
registerV1Handler("customer.subscription.resumed", async (event) => {
	const subscription = event.data.object as SubscriptionWithPeriod;

	stripeLogger.info(
		{ subscriptionId: subscription.id },
		"Subscription resumed",
	);

	const merchant = await findMerchantBySubscription(subscription);

	if (!merchant) {
		stripeLogger.debug(
			{ subscriptionId: subscription.id },
			"No merchant found for subscription",
		);
		return;
	}

	const status = mapStripeStatus(subscription.status);

	await db
		.update(merchants)
		.set({
			subscriptionStatus: status,
			subscriptionCurrentPeriodEnd: subscription.current_period_end
				? new Date(subscription.current_period_end * 1000)
				: null,
		})
		.where(eq(merchants.id, merchant.id));

	stripeLogger.info(
		{
			merchantId: merchant.id,
			subscriptionId: subscription.id,
			status,
		},
		"Marked merchant subscription as resumed",
	);
});

/**
 * Handle customer.subscription.trial_will_end event.
 *
 * Called 3 days before a trial ends. Used to notify the merchant.
 * TODO: Send email notification when email service is ready.
 */
registerV1Handler("customer.subscription.trial_will_end", async (event) => {
	const subscription = event.data.object as SubscriptionWithPeriod;

	const trialEnd = subscription.trial_end
		? new Date(subscription.trial_end * 1000).toISOString()
		: "unknown";

	stripeLogger.info(
		{ subscriptionId: subscription.id, trialEndsAt: trialEnd },
		"Trial ending soon",
	);

	const merchant = await findMerchantBySubscription(subscription);

	if (!merchant) {
		stripeLogger.debug(
			{ subscriptionId: subscription.id },
			"No merchant found for subscription",
		);
		return;
	}

	// TODO: Send email notification to merchant
	// const merchantDetails = await db.query.merchants.findFirst({ ... });
	// await emailService.sendTrialEndingReminder(merchantDetails.email, trialEnd);

	stripeLogger.info(
		{
			merchantId: merchant.id,
			subscriptionId: subscription.id,
			trialEndsAt: trialEnd,
		},
		"Trial will end notification",
	);
});
