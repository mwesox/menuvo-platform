import type Stripe from "stripe";
import { stripeLogger } from "@/lib/logger";
import { getStripeClient } from "./client";

/**
 * Create a trial subscription (no payment method required).
 * Uses customer_account for V2 Accounts API.
 *
 * Trial behavior:
 * - 30-day trial period
 * - No payment method required initially
 * - When trial ends without payment method → subscription pauses
 * - Merchant can add payment method via Billing Portal to resume
 */
export async function createTrialSubscription(
	accountId: string,
	priceId: string,
): Promise<Stripe.Subscription> {
	stripeLogger.info({ accountId, priceId }, "Creating trial subscription");

	try {
		const stripe = getStripeClient();

		const subscription = await stripe.subscriptions.create({
			// V2 Accounts: use customer_account instead of customer
			customer_account: accountId,
			items: [{ price: priceId }],
			trial_period_days: 30,
			payment_settings: {
				save_default_payment_method: "on_subscription",
			},
			trial_settings: {
				end_behavior: {
					missing_payment_method: "pause",
				},
			},
		});

		stripeLogger.info(
			{
				accountId,
				subscriptionId: subscription.id,
				status: subscription.status,
				trialEnd: subscription.trial_end,
			},
			"Trial subscription created successfully",
		);

		return subscription;
	} catch (error) {
		stripeLogger.error(
			{
				accountId,
				priceId,
				error: error instanceof Error ? error.message : String(error),
				stripeError:
					error && typeof error === "object" && "type" in error
						? (error as { type?: string; code?: string; message?: string })
						: undefined,
			},
			"Failed to create trial subscription",
		);
		throw error;
	}
}

/**
 * Create a Checkout Session for paid subscription plans.
 * User is redirected to Stripe Checkout to complete payment.
 */
export async function createSubscriptionCheckout(params: {
	accountId: string;
	priceId: string;
	successUrl: string;
	cancelUrl: string;
	metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
	const stripe = getStripeClient();

	return stripe.checkout.sessions.create({
		// V2 Accounts: use customer_account instead of customer
		customer_account: params.accountId,
		mode: "subscription",
		line_items: [{ price: params.priceId, quantity: 1 }],
		success_url: params.successUrl,
		cancel_url: params.cancelUrl,
		metadata: params.metadata,
	});
}

/**
 * Get subscription details by ID.
 */
export async function getSubscription(
	subscriptionId: string,
): Promise<Stripe.Subscription> {
	const stripe = getStripeClient();
	return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Resume a paused subscription.
 * Called after merchant adds a payment method via Billing Portal.
 * Sets billing_cycle_anchor to 'now' to start a fresh billing cycle.
 */
export async function resumeSubscription(
	subscriptionId: string,
): Promise<Stripe.Subscription> {
	const stripe = getStripeClient();
	return stripe.subscriptions.resume(subscriptionId, {
		billing_cycle_anchor: "now",
	});
}

/**
 * Cancel a subscription.
 * By default, cancels at period end (merchant keeps access until current period ends).
 * Set atPeriodEnd=false to cancel immediately.
 */
export async function cancelSubscription(
	subscriptionId: string,
	atPeriodEnd = true,
): Promise<Stripe.Subscription> {
	const stripe = getStripeClient();

	if (atPeriodEnd) {
		return stripe.subscriptions.update(subscriptionId, {
			cancel_at_period_end: true,
		});
	}

	return stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Create a Billing Portal session for managing subscription.
 * Merchant can update payment method, view invoices, and manage subscription.
 *
 * For V2 Accounts, the account ID (acct_xxx) works as the customer parameter
 * in v1 billing portal endpoints.
 */
export async function createBillingPortalSession(params: {
	accountId: string;
	returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
	const stripe = getStripeClient();

	return stripe.billingPortal.sessions.create({
		// For V2 Accounts, acct_xxx works as customer in v1 endpoints
		customer: params.accountId,
		return_url: params.returnUrl,
	});
}
