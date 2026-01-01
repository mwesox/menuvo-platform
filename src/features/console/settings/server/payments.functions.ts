import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { merchants } from "@/db/schema";
import { env } from "@/env";
import { getStripeClient } from "@/lib/stripe/client";
import { createAccountLink, createStripeAccount } from "@/lib/stripe/connect";
import { createTrialSubscription } from "@/lib/stripe/subscriptions";

/**
 * Get payment account status for a merchant.
 * Returns all payment and subscription fields to determine current state.
 */
export const getPaymentStatus = createServerFn({ method: "GET" })
	.inputValidator(z.object({ merchantId: z.number() }))
	.handler(async ({ data }) => {
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, data.merchantId),
			columns: {
				id: true,
				name: true,
				email: true,
				paymentAccountId: true,
				paymentOnboardingComplete: true,
				paymentCapabilitiesStatus: true,
				paymentRequirementsStatus: true,
				subscriptionStatus: true,
				subscriptionId: true,
				subscriptionTrialEndsAt: true,
				subscriptionCurrentPeriodEnd: true,
			},
		});

		if (!merchant) {
			throw new Error("Merchant not found");
		}

		return merchant;
	});

/**
 * Set up payment account for a merchant.
 * Creates Stripe Connect account and trial subscription.
 * Idempotent - returns existing account if already set up.
 */
export const setupPaymentAccount = createServerFn({ method: "POST" })
	.inputValidator(z.object({ merchantId: z.number() }))
	.handler(async ({ data }) => {
		// Fetch merchant
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, data.merchantId),
			columns: {
				id: true,
				name: true,
				email: true,
				paymentAccountId: true,
				subscriptionId: true,
				subscriptionTrialEndsAt: true,
			},
		});

		if (!merchant) {
			throw new Error("Merchant not found");
		}

		// Idempotent: return existing if already set up
		if (merchant.paymentAccountId && merchant.subscriptionId) {
			return {
				accountId: merchant.paymentAccountId,
				subscriptionId: merchant.subscriptionId,
				trialEndsAt: merchant.subscriptionTrialEndsAt,
				alreadySetUp: true,
			};
		}

		const stripe = getStripeClient();

		// Step 1: Create Stripe Connect account (if not exists)
		let accountId = merchant.paymentAccountId;
		if (!accountId) {
			const result = await createStripeAccount(stripe, {
				email: merchant.email,
				businessName: merchant.name,
			});
			accountId = result.accountId;

			// Update merchant with account ID
			await db
				.update(merchants)
				.set({
					paymentAccountId: accountId,
					paymentOnboardingComplete: false,
					paymentCapabilitiesStatus: "pending",
					paymentRequirementsStatus: "currently_due",
				})
				.where(eq(merchants.id, merchant.id));
		}

		// Step 2: Create trial subscription
		const priceId = env.STRIPE_PRICE_STARTER;
		if (!priceId) {
			throw new Error("STRIPE_PRICE_STARTER not configured");
		}

		const subscription = await createTrialSubscription(accountId, priceId);

		// Update merchant with subscription info
		const trialEndsAt = subscription.trial_end
			? new Date(subscription.trial_end * 1000)
			: null;

		// Get current period end - use trial_end as fallback
		const currentPeriodEnd =
			(subscription as { current_period_end?: number }).current_period_end ??
			subscription.trial_end ??
			Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

		await db
			.update(merchants)
			.set({
				subscriptionId: subscription.id,
				subscriptionStatus: "trialing",
				subscriptionPriceId: priceId,
				subscriptionTrialEndsAt: trialEndsAt,
				subscriptionCurrentPeriodEnd: new Date(currentPeriodEnd * 1000),
			})
			.where(eq(merchants.id, merchant.id));

		return {
			accountId,
			subscriptionId: subscription.id,
			trialEndsAt,
			alreadySetUp: false,
		};
	});

/**
 * Create a Stripe account onboarding link.
 * Redirects merchant to Stripe to complete identity verification, bank details, etc.
 */
export const createPaymentOnboardingLink = createServerFn({ method: "POST" })
	.inputValidator(z.object({ merchantId: z.number() }))
	.handler(async ({ data }) => {
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, data.merchantId),
			columns: {
				paymentAccountId: true,
			},
		});

		if (!merchant?.paymentAccountId) {
			throw new Error("Merchant has no payment account");
		}

		const stripe = getStripeClient();
		const serverUrl = env.SERVER_URL || "http://localhost:3000";

		const accountLink = await createAccountLink(stripe, {
			accountId: merchant.paymentAccountId,
			refreshUrl: `${serverUrl}/console/settings/payments?refresh=true`,
			returnUrl: `${serverUrl}/console/settings/payments?from=stripe`,
		});

		return {
			url: accountLink.url,
			expiresAt: accountLink.expiresAt,
		};
	});

/**
 * Refresh payment status from Stripe.
 * Syncs the latest account status from Stripe API.
 */
export const refreshPaymentStatus = createServerFn({ method: "POST" })
	.inputValidator(z.object({ merchantId: z.number() }))
	.handler(async ({ data }) => {
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, data.merchantId),
			columns: {
				id: true,
				paymentAccountId: true,
			},
		});

		if (!merchant?.paymentAccountId) {
			throw new Error("Merchant has no payment account");
		}

		const stripe = getStripeClient();

		// Fetch account from Stripe V2 API
		const account = await stripe.v2.core.accounts.retrieve(
			merchant.paymentAccountId,
			{
				include: ["configuration.merchant", "requirements"],
			},
		);

		// Cast to flexible type to access V2 API response fields
		const accountData = account as {
			requirements?: {
				past_due?: string[];
				currently_due?: string[];
				pending_verification?: string[];
			};
			configuration?: {
				merchant?: {
					capabilities?: {
						card_payments?: {
							status?: string;
						};
					};
				};
			};
		};

		// Map requirements status
		let requirementsStatus:
			| "none"
			| "currently_due"
			| "past_due"
			| "pending_verification" = "none";
		let onboardingComplete = true;

		const reqs = accountData.requirements;
		if (reqs) {
			if (reqs.past_due && reqs.past_due.length > 0) {
				requirementsStatus = "past_due";
				onboardingComplete = false;
			} else if (reqs.currently_due && reqs.currently_due.length > 0) {
				requirementsStatus = "currently_due";
				onboardingComplete = false;
			} else if (
				reqs.pending_verification &&
				reqs.pending_verification.length > 0
			) {
				requirementsStatus = "pending_verification";
				onboardingComplete = false;
			}
		}

		// Map capabilities status
		let capabilitiesStatus: "active" | "pending" | "inactive" = "pending";
		const cardPaymentsStatus =
			accountData.configuration?.merchant?.capabilities?.card_payments?.status;
		if (cardPaymentsStatus === "active") {
			capabilitiesStatus = "active";
		} else if (
			cardPaymentsStatus === "inactive" ||
			cardPaymentsStatus === "restricted"
		) {
			capabilitiesStatus = "inactive";
		}

		// Update merchant record
		await db
			.update(merchants)
			.set({
				paymentOnboardingComplete: onboardingComplete,
				paymentRequirementsStatus: requirementsStatus,
				paymentCapabilitiesStatus: capabilitiesStatus,
			})
			.where(eq(merchants.id, merchant.id));

		return {
			onboardingComplete,
			requirementsStatus,
			capabilitiesStatus,
		};
	});
