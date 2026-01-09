/**
 * Stripe Payment Service
 *
 * High-level service functions for Stripe Connect operations.
 * These functions combine multiple lower-level service calls
 * to provide complete business operations.
 */

import { db } from "@menuvo/db";
import { merchants } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { stripeLogger } from "../../lib/logger.js";
import { getStripeClient } from "../stripe/client.js";
import {
	createAccountLink,
	createStripeAccount,
	deleteStripeAccount,
} from "../stripe/connect.js";
import { parseV2AccountStatus } from "../stripe/v2-account.js";

export type SetupStripeAccountInput = {
	merchantId: string;
	email: string;
	businessName: string;
	returnUrl: string;
	refreshUrl: string;
};

export type SetupStripeAccountOutput = {
	accountId: string;
	onboardingUrl: string;
	expiresAt: number;
};

/**
 * Complete Stripe Connect account setup flow.
 *
 * 1. Creates a Stripe Connect account (if needed)
 * 2. Creates an account link for onboarding
 * 3. Updates the merchant record with the account ID
 *
 * @returns The onboarding URL to redirect the merchant to
 */
export async function setupStripeConnectAccount(
	input: SetupStripeAccountInput,
): Promise<SetupStripeAccountOutput> {
	const stripe = getStripeClient();

	stripeLogger.info(
		{ merchantId: input.merchantId, email: input.email },
		"Starting Stripe Connect account setup",
	);

	// Check if merchant already has a Stripe account
	const merchant = await db.query.merchants.findFirst({
		where: eq(merchants.id, input.merchantId),
		columns: {
			id: true,
			paymentAccountId: true,
		},
	});

	if (!merchant) {
		throw new Error("Merchant not found");
	}

	let accountId = merchant.paymentAccountId;

	// Create account if it doesn't exist
	if (!accountId) {
		const { accountId: newAccountId } = await createStripeAccount(stripe, {
			email: input.email,
			businessName: input.businessName,
		});

		accountId = newAccountId;

		// Update merchant with new account ID
		await db
			.update(merchants)
			.set({ paymentAccountId: accountId })
			.where(eq(merchants.id, input.merchantId));

		stripeLogger.info(
			{ merchantId: input.merchantId, accountId },
			"Created Stripe Connect account",
		);
	}

	// Create account link for onboarding
	const { url, expiresAt } = await createAccountLink(stripe, {
		accountId,
		refreshUrl: input.refreshUrl,
		returnUrl: input.returnUrl,
	});

	stripeLogger.info(
		{ merchantId: input.merchantId, accountId, expiresAt },
		"Created Stripe onboarding link",
	);

	return {
		accountId,
		onboardingUrl: url,
		expiresAt,
	};
}

export type RefreshStripeStatusInput = {
	merchantId: string;
	accountId: string;
};

export type RefreshStripeStatusOutput = {
	onboardingComplete: boolean;
	capabilitiesStatus: "active" | "pending" | "inactive";
	requirementsStatus:
		| "none"
		| "currently_due"
		| "past_due"
		| "pending_verification";
};

/**
 * Refresh Stripe account status from Stripe API.
 *
 * Fetches the current status from Stripe and updates the database.
 *
 * @returns The parsed payment status
 */
export async function refreshStripeAccountStatus(
	input: RefreshStripeStatusInput,
): Promise<RefreshStripeStatusOutput> {
	const stripe = getStripeClient();

	stripeLogger.info(
		{ merchantId: input.merchantId, accountId: input.accountId },
		"Refreshing Stripe account status",
	);

	// Fetch account from Stripe
	const account = await stripe.v2.core.accounts.retrieve(input.accountId, {
		include: ["configuration.merchant", "requirements"],
	});

	// Parse the status
	const status = parseV2AccountStatus(account);

	// Update merchant record
	await db
		.update(merchants)
		.set({
			paymentOnboardingComplete: status.onboardingComplete,
			paymentCapabilitiesStatus: status.capabilitiesStatus,
			paymentRequirementsStatus: status.requirementsStatus,
		})
		.where(eq(merchants.id, input.merchantId));

	stripeLogger.info(
		{
			merchantId: input.merchantId,
			accountId: input.accountId,
			status,
		},
		"Stripe account status refreshed",
	);

	return status;
}

/**
 * Create a new onboarding link for an existing Stripe Connect account.
 *
 * Use this when the merchant needs to continue or resume onboarding.
 */
export async function createStripeOnboardingLink(input: {
	accountId: string;
	returnUrl: string;
	refreshUrl: string;
}): Promise<{ url: string; expiresAt: number }> {
	const stripe = getStripeClient();

	const { url, expiresAt } = await createAccountLink(stripe, {
		accountId: input.accountId,
		refreshUrl: input.refreshUrl,
		returnUrl: input.returnUrl,
	});

	return { url, expiresAt };
}

/**
 * Cleanup a failed Stripe Connect account setup.
 *
 * Call this as a compensating transaction if account creation
 * succeeded but subsequent operations failed.
 */
export async function cleanupStripeAccount(
	merchantId: string,
	accountId: string,
): Promise<void> {
	const stripe = getStripeClient();

	stripeLogger.info(
		{ merchantId, accountId },
		"Cleaning up failed Stripe account",
	);

	try {
		// Delete from Stripe
		await deleteStripeAccount(stripe, accountId);

		// Clear from database
		await db
			.update(merchants)
			.set({
				paymentAccountId: null,
				paymentOnboardingComplete: false,
				paymentCapabilitiesStatus: null,
				paymentRequirementsStatus: null,
			})
			.where(eq(merchants.id, merchantId));

		stripeLogger.info({ merchantId, accountId }, "Stripe account cleaned up");
	} catch (error) {
		stripeLogger.error(
			{
				merchantId,
				accountId,
				error: error instanceof Error ? error.message : String(error),
			},
			"Failed to cleanup Stripe account",
		);
		throw error;
	}
}
