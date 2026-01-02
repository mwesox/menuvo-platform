import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { merchants } from "@/db/schema";
import { env } from "@/env";
import { withAuth } from "@/features/console/auth/server/auth-middleware";
import { paymentsLogger } from "@/lib/logger";
import { getStripeClient } from "@/lib/stripe/client";
import { createAccountLink, createStripeAccount } from "@/lib/stripe/connect";
import { createTrialSubscription } from "@/lib/stripe/subscriptions";

/**
 * Get payment account status for a merchant.
 * Returns all payment and subscription fields to determine current state.
 */
export const getPaymentStatus = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { merchantId } = context.auth;
		paymentsLogger.debug({ merchantId }, "Getting payment status");

		try {
			const merchant = await db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
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
				paymentsLogger.error({ merchantId }, "Merchant not found");
				throw new Error("Merchant not found");
			}

			paymentsLogger.info(
				{
					merchantId,
					hasPaymentAccount: !!merchant.paymentAccountId,
					subscriptionStatus: merchant.subscriptionStatus,
				},
				"Payment status retrieved",
			);

			return merchant;
		} catch (error) {
			paymentsLogger.error(
				{
					merchantId,
					error: error instanceof Error ? error.message : String(error),
				},
				"Failed to get payment status",
			);
			throw error;
		}
	});

/**
 * Set up payment account for a merchant.
 * Creates Stripe Connect account and trial subscription.
 * Idempotent - returns existing account if already set up.
 */
export const setupPaymentAccount = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { merchantId } = context.auth;
		paymentsLogger.info({ merchantId }, "Setting up payment account");

		try {
			// Fetch merchant
			const merchant = await db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
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
				paymentsLogger.error({ merchantId }, "Merchant not found for setup");
				throw new Error("Merchant not found");
			}

			// Idempotent: return existing if already set up
			if (merchant.paymentAccountId && merchant.subscriptionId) {
				paymentsLogger.info(
					{
						merchantId,
						accountId: merchant.paymentAccountId,
						subscriptionId: merchant.subscriptionId,
					},
					"Account already set up",
				);
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
				paymentsLogger.info(
					{ merchantId, email: merchant.email },
					"Creating Stripe Connect account",
				);

				const result = await createStripeAccount(stripe, {
					email: merchant.email,
					businessName: merchant.name,
				});
				accountId = result.accountId;

				paymentsLogger.info(
					{ merchantId, accountId },
					"Stripe Connect account created",
				);

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
				paymentsLogger.error(
					{ merchantId },
					"STRIPE_PRICE_STARTER not configured",
				);
				throw new Error("STRIPE_PRICE_STARTER not configured");
			}

			paymentsLogger.info(
				{ merchantId, accountId, priceId },
				"Creating trial subscription",
			);

			const subscription = await createTrialSubscription(accountId, priceId);

			paymentsLogger.info(
				{
					merchantId,
					subscriptionId: subscription.id,
					trialEnd: subscription.trial_end,
				},
				"Trial subscription created",
			);

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

			paymentsLogger.info(
				{
					merchantId,
					accountId,
					subscriptionId: subscription.id,
					trialEndsAt,
				},
				"Payment account setup complete",
			);

			return {
				accountId,
				subscriptionId: subscription.id,
				trialEndsAt,
				alreadySetUp: false,
			};
		} catch (error) {
			paymentsLogger.error(
				{
					merchantId,
					error: error instanceof Error ? error.message : String(error),
				},
				"Failed to set up payment account",
			);
			throw error;
		}
	});

/**
 * Create a Stripe account onboarding link.
 * Redirects merchant to Stripe to complete identity verification, bank details, etc.
 */
export const createPaymentOnboardingLink = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { merchantId } = context.auth;
		paymentsLogger.info({ merchantId }, "Creating onboarding link");

		try {
			const merchant = await db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					paymentAccountId: true,
				},
			});

			if (!merchant?.paymentAccountId) {
				paymentsLogger.error({ merchantId }, "Merchant has no payment account");
				throw new Error("Merchant has no payment account");
			}

			const stripe = getStripeClient();
			const serverUrl = env.SERVER_URL || "http://localhost:3000";

			paymentsLogger.debug(
				{
					merchantId,
					accountId: merchant.paymentAccountId,
					serverUrl,
				},
				"Calling Stripe to create account link",
			);

			const accountLink = await createAccountLink(stripe, {
				accountId: merchant.paymentAccountId,
				refreshUrl: `${serverUrl}/console/settings/payments?refresh=true`,
				returnUrl: `${serverUrl}/console/settings/payments?from=stripe`,
			});

			paymentsLogger.info(
				{
					merchantId,
					accountId: merchant.paymentAccountId,
					expiresAt: new Date(accountLink.expiresAt).toISOString(),
				},
				"Onboarding link created successfully",
			);

			return {
				url: accountLink.url,
				expiresAt: accountLink.expiresAt,
			};
		} catch (error) {
			paymentsLogger.error(
				{
					merchantId,
					error: error instanceof Error ? error.message : String(error),
					stripeError:
						error && typeof error === "object" && "type" in error
							? {
									type: (error as { type?: string }).type,
									code: (error as { code?: string }).code,
									message: (error as { message?: string }).message,
								}
							: undefined,
				},
				"Failed to create onboarding link",
			);
			throw error;
		}
	});

/**
 * Refresh payment status from Stripe.
 * Syncs the latest account status from Stripe API.
 */
export const refreshPaymentStatus = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { merchantId } = context.auth;
		paymentsLogger.info({ merchantId }, "Refreshing payment status");

		try {
			const merchant = await db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					id: true,
					paymentAccountId: true,
				},
			});

			if (!merchant?.paymentAccountId) {
				paymentsLogger.error(
					{ merchantId },
					"Merchant has no payment account for refresh",
				);
				throw new Error("Merchant has no payment account");
			}

			const stripe = getStripeClient();

			paymentsLogger.debug(
				{
					merchantId,
					accountId: merchant.paymentAccountId,
				},
				"Fetching account from Stripe",
			);

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

			paymentsLogger.debug(
				{
					merchantId,
					accountId: merchant.paymentAccountId,
					requirements: accountData.requirements,
					cardPaymentsStatus:
						accountData.configuration?.merchant?.capabilities?.card_payments
							?.status,
				},
				"Stripe account data retrieved",
			);

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
				accountData.configuration?.merchant?.capabilities?.card_payments
					?.status;
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

			paymentsLogger.info(
				{
					merchantId,
					onboardingComplete,
					requirementsStatus,
					capabilitiesStatus,
				},
				"Payment status refreshed",
			);

			return {
				onboardingComplete,
				requirementsStatus,
				capabilitiesStatus,
			};
		} catch (error) {
			paymentsLogger.error(
				{
					merchantId,
					error: error instanceof Error ? error.message : String(error),
					stripeError:
						error && typeof error === "object" && "type" in error
							? {
									type: (error as { type?: string }).type,
									code: (error as { code?: string }).code,
									message: (error as { message?: string }).message,
								}
							: undefined,
				},
				"Failed to refresh payment status",
			);
			throw error;
		}
	});
