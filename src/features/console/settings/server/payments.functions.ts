import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { merchants } from "@/db/schema";
import { env } from "@/env";
import { withAuth } from "@/features/console/auth/server/auth-middleware";
import { decryptToken } from "@/lib/crypto";
import { paymentsLogger } from "@/lib/logger";
import { createClientLink, getOnboardingStatus } from "@/lib/mollie";
import { getStripeClient } from "@/lib/stripe/client";
import { createAccountLink, createStripeAccount } from "@/lib/stripe/connect";
import { createTrialSubscription } from "@/lib/stripe/subscriptions";
import { parseV2AccountStatus } from "@/lib/stripe/v2-account";

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

			paymentsLogger.debug(
				{
					merchantId,
					accountId: merchant.paymentAccountId,
					requirementsStatus:
						account.requirements?.summary?.minimum_deadline?.status,
					cardPaymentsStatus:
						account.configuration?.merchant?.capabilities?.card_payments
							?.status,
				},
				"Stripe account data retrieved",
			);

			// Parse V2 account status using shared utility (uses SDK types + defensive defaults)
			const { requirementsStatus, capabilitiesStatus, onboardingComplete } =
				parseV2AccountStatus(account);

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

// ============================================================================
// MOLLIE PAYMENT FUNCTIONS
// ============================================================================

/**
 * Get Mollie payment status for a merchant.
 * Returns Mollie-specific payment and onboarding fields.
 */
export const getMolliePaymentStatus = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { merchantId } = context.auth;
		paymentsLogger.debug({ merchantId }, "Getting Mollie payment status");

		try {
			const merchant = await db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					id: true,
					name: true,
					email: true,
					paymentProvider: true,
					mollieOrganizationId: true,
					mollieProfileId: true,
					mollieOnboardingStatus: true,
					mollieCanReceivePayments: true,
					mollieCanReceiveSettlements: true,
					mollieMandateId: true,
					mollieMandateStatus: true,
					mollieSubscriptionId: true,
					mollieSubscriptionStatus: true,
				},
			});

			if (!merchant) {
				paymentsLogger.error({ merchantId }, "Merchant not found");
				throw new Error("Merchant not found");
			}

			paymentsLogger.info(
				{
					merchantId,
					hasMollieAccount: !!merchant.mollieOrganizationId,
					onboardingStatus: merchant.mollieOnboardingStatus,
				},
				"Mollie payment status retrieved",
			);

			return merchant;
		} catch (error) {
			paymentsLogger.error(
				{
					merchantId,
					error: error instanceof Error ? error.message : String(error),
				},
				"Failed to get Mollie payment status",
			);
			throw error;
		}
	});

/**
 * Set up Mollie payment account for a merchant.
 * Uses Client Links API to create a Mollie account for the merchant,
 * then redirects them to complete OAuth authorization.
 * Idempotent - returns existing if already set up.
 */
export const setupMolliePaymentAccount = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { merchantId } = context.auth;
		paymentsLogger.info({ merchantId }, "Setting up Mollie payment account");

		try {
			// Fetch merchant
			const merchant = await db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					id: true,
					name: true,
					email: true,
					mollieOrganizationId: true,
					mollieOnboardingStatus: true,
				},
			});

			if (!merchant) {
				paymentsLogger.error({ merchantId }, "Merchant not found for setup");
				throw new Error("Merchant not found");
			}

			// If already fully connected with tokens, don't start new OAuth flow
			if (
				merchant.mollieOrganizationId &&
				merchant.mollieOnboardingStatus === "completed"
			) {
				paymentsLogger.info(
					{
						merchantId,
						organizationId: merchant.mollieOrganizationId,
					},
					"Mollie account already set up",
				);
				return {
					organizationId: merchant.mollieOrganizationId,
					alreadySetUp: true,
				};
			}

			// If they started but didn't complete OAuth (no tokens yet),
			// allow them to try again - create a new client link

			// State parameter includes merchantId for verification on callback
			const state = Buffer.from(JSON.stringify({ merchantId })).toString(
				"base64url",
			);

			// Create a Client Link with OAuth params embedded
			// This URL takes merchant directly to Mollie signup with pre-filled data
			const clientLink = await createClientLink({
				name: merchant.name,
				email: merchant.email,
				state,
			});

			// Update merchant with pending onboarding status
			await db
				.update(merchants)
				.set({
					mollieOnboardingStatus: "needs-data",
				})
				.where(eq(merchants.id, merchantId));

			paymentsLogger.info(
				{
					merchantId,
					clientLinkId: clientLink.clientLinkId,
					onboardingUrl: clientLink.onboardingUrl,
				},
				"Mollie client link created",
			);

			return {
				onboardingUrl: clientLink.onboardingUrl,
				alreadySetUp: false,
			};
		} catch (error) {
			paymentsLogger.error(
				{
					merchantId,
					error: error instanceof Error ? error.message : String(error),
				},
				"Failed to set up Mollie payment account",
			);
			throw error;
		}
	});

/**
 * Refresh Mollie payment status from API.
 * Syncs the latest onboarding and capability status using the Onboarding API.
 */
export const refreshMolliePaymentStatus = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { merchantId } = context.auth;
		paymentsLogger.info({ merchantId }, "Refreshing Mollie payment status");

		try {
			const merchant = await db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					mollieAccessToken: true,
				},
			});

			if (!merchant?.mollieAccessToken) {
				paymentsLogger.error(
					{ merchantId },
					"Merchant has no Mollie access token",
				);
				throw new Error("Merchant has no Mollie account connected");
			}

			// Use onboarding API to get correct status (not organization API)
			const accessToken = await decryptToken(merchant.mollieAccessToken);
			const onboardingStatus = await getOnboardingStatus(accessToken);

			// Map Mollie status to our enum values
			const mappedStatus = onboardingStatus.canReceivePayments
				? "completed"
				: onboardingStatus.status === "in-review"
					? "in-review"
					: "needs-data";

			// Update merchant record
			await db
				.update(merchants)
				.set({
					mollieOnboardingStatus: mappedStatus,
					mollieCanReceivePayments: onboardingStatus.canReceivePayments,
					mollieCanReceiveSettlements: onboardingStatus.canReceiveSettlements,
				})
				.where(eq(merchants.id, merchantId));

			paymentsLogger.info(
				{
					merchantId,
					status: onboardingStatus.status,
					canReceivePayments: onboardingStatus.canReceivePayments,
					canReceiveSettlements: onboardingStatus.canReceiveSettlements,
				},
				"Mollie payment status refreshed",
			);

			return {
				onboardingStatus: onboardingStatus.status,
				canReceivePayments: onboardingStatus.canReceivePayments,
				canReceiveSettlements: onboardingStatus.canReceiveSettlements,
			};
		} catch (error) {
			paymentsLogger.error(
				{
					merchantId,
					error: error instanceof Error ? error.message : String(error),
				},
				"Failed to refresh Mollie payment status",
			);
			throw error;
		}
	});

/**
 * Get the Mollie onboarding dashboard URL.
 * Returns the link from Mollie's onboarding API to complete verification.
 */
export const getMollieDashboardUrl = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { merchantId } = context.auth;
		paymentsLogger.info({ merchantId }, "Getting Mollie dashboard URL");

		try {
			// Get merchant token
			const merchant = await db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					mollieAccessToken: true,
				},
			});

			if (!merchant?.mollieAccessToken) {
				throw new Error("Merchant has no Mollie account connected");
			}

			// Decrypt token and get onboarding status with dashboard link
			const accessToken = await decryptToken(merchant.mollieAccessToken);
			const status = await getOnboardingStatus(accessToken);

			if (!status.dashboardUrl) {
				throw new Error("Mollie did not provide a dashboard URL");
			}

			paymentsLogger.info(
				{ merchantId, dashboardUrl: status.dashboardUrl },
				"Dashboard URL retrieved from Mollie API",
			);
			return { dashboardUrl: status.dashboardUrl };
		} catch (error) {
			paymentsLogger.error(
				{
					merchantId,
					error: error instanceof Error ? error.message : String(error),
				},
				"Failed to get Mollie dashboard URL",
			);
			throw error;
		}
	});
