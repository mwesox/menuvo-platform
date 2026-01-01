import { eq, or } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db";
import { merchants, type SubscriptionStatus } from "@/db/schema";

/**
 * Stripe subscription with period fields.
 * The Stripe v20 types may not have all properties exposed correctly,
 * so we extend the type with the fields we know exist at runtime.
 */
type SubscriptionWithPeriod = Stripe.Subscription & {
	current_period_end?: number | null;
	trial_end?: number | null;
};

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

/**
 * Handle customer.subscription.created event.
 *
 * Called when a new subscription is created for a customer_account.
 * Updates the merchant's subscription fields.
 */
export async function handleSubscriptionCreated(
	subscription: SubscriptionWithPeriod,
): Promise<void> {
	console.log(
		`Subscription created: ${subscription.id}, status: ${subscription.status}`,
	);

	const merchant = await findMerchantBySubscription(subscription);

	if (!merchant) {
		// This may happen if the subscription is created before the merchant record
		// (e.g., during onboarding where we create subscription first, then merchant in DB)
		console.log(
			`No merchant found for subscription ${subscription.id} - may be pending onboarding`,
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

	console.info("Updated merchant subscription (created)", {
		merchantId: merchant.id,
		subscriptionId: subscription.id,
		status,
	});
}

/**
 * Handle customer.subscription.updated event.
 *
 * Called when a subscription is modified (status change, renewal, etc.).
 * Syncs the subscription status to our merchant record.
 */
export async function handleSubscriptionUpdated(
	subscription: SubscriptionWithPeriod,
): Promise<void> {
	console.log(
		`Subscription updated: ${subscription.id}, status: ${subscription.status}`,
	);

	const merchant = await findMerchantBySubscription(subscription);

	if (!merchant) {
		console.log(`No merchant found for subscription ${subscription.id}`);
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

	console.info("Updated merchant subscription (updated)", {
		merchantId: merchant.id,
		subscriptionId: subscription.id,
		status,
	});
}

/**
 * Handle customer.subscription.deleted event.
 *
 * Called when a subscription is canceled and reaches the end of its period.
 * Marks the merchant subscription as canceled.
 */
export async function handleSubscriptionDeleted(
	subscription: SubscriptionWithPeriod,
): Promise<void> {
	console.log(`Subscription deleted: ${subscription.id}`);

	const merchant = await findMerchantBySubscription(subscription);

	if (!merchant) {
		console.log(`No merchant found for subscription ${subscription.id}`);
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

	console.info("Marked merchant subscription as canceled", {
		merchantId: merchant.id,
		subscriptionId: subscription.id,
	});
}

/**
 * Handle customer.subscription.paused event.
 *
 * Called when a subscription is paused (e.g., trial ended without payment method).
 * Restricts merchant access until payment method is added.
 */
export async function handleSubscriptionPaused(
	subscription: SubscriptionWithPeriod,
): Promise<void> {
	console.log(`Subscription paused: ${subscription.id}`);

	const merchant = await findMerchantBySubscription(subscription);

	if (!merchant) {
		console.log(`No merchant found for subscription ${subscription.id}`);
		return;
	}

	await db
		.update(merchants)
		.set({
			subscriptionStatus: "paused",
		})
		.where(eq(merchants.id, merchant.id));

	console.info("Marked merchant subscription as paused", {
		merchantId: merchant.id,
		subscriptionId: subscription.id,
	});
}

/**
 * Handle customer.subscription.resumed event.
 *
 * Called when a paused subscription is resumed (payment method added).
 * Restores merchant access.
 */
export async function handleSubscriptionResumed(
	subscription: SubscriptionWithPeriod,
): Promise<void> {
	console.log(`Subscription resumed: ${subscription.id}`);

	const merchant = await findMerchantBySubscription(subscription);

	if (!merchant) {
		console.log(`No merchant found for subscription ${subscription.id}`);
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

	console.info("Marked merchant subscription as resumed", {
		merchantId: merchant.id,
		subscriptionId: subscription.id,
		status,
	});
}

/**
 * Handle customer.subscription.trial_will_end event.
 *
 * Called 3 days before a trial ends. Used to notify the merchant.
 * TODO: Send email notification when email service is ready.
 */
export async function handleTrialWillEnd(
	subscription: SubscriptionWithPeriod,
): Promise<void> {
	const trialEnd = subscription.trial_end
		? new Date(subscription.trial_end * 1000).toISOString()
		: "unknown";

	console.log(
		`Trial ending soon for subscription ${subscription.id}, ends at: ${trialEnd}`,
	);

	const merchant = await findMerchantBySubscription(subscription);

	if (!merchant) {
		console.log(`No merchant found for subscription ${subscription.id}`);
		return;
	}

	// TODO: Send email notification to merchant
	// const merchantDetails = await db.query.merchants.findFirst({ ... });
	// await emailService.sendTrialEndingReminder(merchantDetails.email, trialEnd);

	console.info("Trial will end notification", {
		merchantId: merchant.id,
		subscriptionId: subscription.id,
		trialEndsAt: trialEnd,
	});
}
