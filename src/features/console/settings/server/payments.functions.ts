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
		console.info("[Payments] Getting payment status", {
			merchantId: data.merchantId,
		});

		try {
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
				console.error("[Payments] Merchant not found", {
					merchantId: data.merchantId,
				});
				throw new Error("Merchant not found");
			}

			console.info("[Payments] Payment status retrieved", {
				merchantId: data.merchantId,
				hasPaymentAccount: !!merchant.paymentAccountId,
				subscriptionStatus: merchant.subscriptionStatus,
			});

			return merchant;
		} catch (error) {
			console.error("[Payments] Failed to get payment status", {
				merchantId: data.merchantId,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	});

/**
 * Set up payment account for a merchant.
 * Creates Stripe Connect account and trial subscription.
 * Idempotent - returns existing account if already set up.
 */
export const setupPaymentAccount = createServerFn({ method: "POST" })
	.inputValidator(z.object({ merchantId: z.number() }))
	.handler(async ({ data }) => {
		console.info("[Payments] Setting up payment account", {
			merchantId: data.merchantId,
		});

		try {
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
				console.error("[Payments] Merchant not found for setup", {
					merchantId: data.merchantId,
				});
				throw new Error("Merchant not found");
			}

			// Idempotent: return existing if already set up
			if (merchant.paymentAccountId && merchant.subscriptionId) {
				console.info("[Payments] Account already set up", {
					merchantId: data.merchantId,
					accountId: merchant.paymentAccountId,
					subscriptionId: merchant.subscriptionId,
				});
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
				console.info("[Payments] Creating Stripe Connect account", {
					merchantId: data.merchantId,
					email: merchant.email,
				});

				const result = await createStripeAccount(stripe, {
					email: merchant.email,
					businessName: merchant.name,
				});
				accountId = result.accountId;

				console.info("[Payments] Stripe Connect account created", {
					merchantId: data.merchantId,
					accountId,
				});

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
				console.error("[Payments] STRIPE_PRICE_STARTER not configured", {
					merchantId: data.merchantId,
				});
				throw new Error("STRIPE_PRICE_STARTER not configured");
			}

			console.info("[Payments] Creating trial subscription", {
				merchantId: data.merchantId,
				accountId,
				priceId,
			});

			const subscription = await createTrialSubscription(accountId, priceId);

			console.info("[Payments] Trial subscription created", {
				merchantId: data.merchantId,
				subscriptionId: subscription.id,
				trialEnd: subscription.trial_end,
			});

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

			console.info("[Payments] Payment account setup complete", {
				merchantId: data.merchantId,
				accountId,
				subscriptionId: subscription.id,
				trialEndsAt,
			});

			return {
				accountId,
				subscriptionId: subscription.id,
				trialEndsAt,
				alreadySetUp: false,
			};
		} catch (error) {
			console.error("[Payments] Failed to set up payment account", {
				merchantId: data.merchantId,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			});
			throw error;
		}
	});

/**
 * Create a Stripe account onboarding link.
 * Redirects merchant to Stripe to complete identity verification, bank details, etc.
 */
export const createPaymentOnboardingLink = createServerFn({ method: "POST" })
	.inputValidator(z.object({ merchantId: z.number() }))
	.handler(async ({ data }) => {
		console.info("[Payments] Creating onboarding link", {
			merchantId: data.merchantId,
		});

		try {
			const merchant = await db.query.merchants.findFirst({
				where: eq(merchants.id, data.merchantId),
				columns: {
					paymentAccountId: true,
				},
			});

			if (!merchant?.paymentAccountId) {
				console.error("[Payments] Merchant has no payment account", {
					merchantId: data.merchantId,
				});
				throw new Error("Merchant has no payment account");
			}

			const stripe = getStripeClient();
			const serverUrl = env.SERVER_URL || "http://localhost:3000";

			console.info("[Payments] Calling Stripe to create account link", {
				merchantId: data.merchantId,
				accountId: merchant.paymentAccountId,
				serverUrl,
			});

			const accountLink = await createAccountLink(stripe, {
				accountId: merchant.paymentAccountId,
				refreshUrl: `${serverUrl}/console/settings/payments?refresh=true`,
				returnUrl: `${serverUrl}/console/settings/payments?from=stripe`,
			});

			console.info("[Payments] Onboarding link created successfully", {
				merchantId: data.merchantId,
				accountId: merchant.paymentAccountId,
				url: accountLink.url,
				expiresAt: new Date(accountLink.expiresAt).toISOString(),
			});

			return {
				url: accountLink.url,
				expiresAt: accountLink.expiresAt,
			};
		} catch (error) {
			console.error("[Payments] Failed to create onboarding link", {
				merchantId: data.merchantId,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				// Extract Stripe error details if available
				stripeError:
					error && typeof error === "object" && "type" in error
						? {
								type: (error as { type?: string }).type,
								code: (error as { code?: string }).code,
								message: (error as { message?: string }).message,
							}
						: undefined,
			});
			throw error;
		}
	});

/**
 * Refresh payment status from Stripe.
 * Syncs the latest account status from Stripe API.
 */
export const refreshPaymentStatus = createServerFn({ method: "POST" })
	.inputValidator(z.object({ merchantId: z.number() }))
	.handler(async ({ data }) => {
		console.info("[Payments] Refreshing payment status", {
			merchantId: data.merchantId,
		});

		try {
			const merchant = await db.query.merchants.findFirst({
				where: eq(merchants.id, data.merchantId),
				columns: {
					id: true,
					paymentAccountId: true,
				},
			});

			if (!merchant?.paymentAccountId) {
				console.error(
					"[Payments] Merchant has no payment account for refresh",
					{
						merchantId: data.merchantId,
					},
				);
				throw new Error("Merchant has no payment account");
			}

			const stripe = getStripeClient();

			console.info("[Payments] Fetching account from Stripe", {
				merchantId: data.merchantId,
				accountId: merchant.paymentAccountId,
			});

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

			console.info("[Payments] Stripe account data retrieved", {
				merchantId: data.merchantId,
				accountId: merchant.paymentAccountId,
				requirements: accountData.requirements,
				cardPaymentsStatus:
					accountData.configuration?.merchant?.capabilities?.card_payments
						?.status,
			});

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

			console.info("[Payments] Payment status refreshed", {
				merchantId: data.merchantId,
				onboardingComplete,
				requirementsStatus,
				capabilitiesStatus,
			});

			return {
				onboardingComplete,
				requirementsStatus,
				capabilitiesStatus,
			};
		} catch (error) {
			console.error("[Payments] Failed to refresh payment status", {
				merchantId: data.merchantId,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				stripeError:
					error && typeof error === "object" && "type" in error
						? {
								type: (error as { type?: string }).type,
								code: (error as { code?: string }).code,
								message: (error as { message?: string }).message,
							}
						: undefined,
			});
			throw error;
		}
	});
