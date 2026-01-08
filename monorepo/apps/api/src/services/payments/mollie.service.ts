/**
 * Mollie Payment Service
 *
 * High-level service functions for Mollie Connect operations.
 * These functions combine multiple lower-level service calls
 * to provide complete business operations.
 */

import { db } from "@menuvo/db";
import { merchants } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { mollieLogger } from "../../lib/logger.js";
import {
	createClientLink,
	enableDefaultPaymentMethods,
	getMerchantMollieClient,
	getOnboardingStatus,
} from "../mollie/connect.js";

export type SetupMollieAccountInput = {
	merchantId: string;
	name: string;
	email: string;
	state?: string;
};

export type SetupMollieAccountOutput = {
	clientLinkId: string;
	onboardingUrl: string;
};

/**
 * Initiate Mollie Connect account setup flow.
 *
 * Creates a client link for co-branded merchant onboarding.
 * The merchant should be redirected to the onboarding URL.
 *
 * After the merchant completes onboarding, they will be redirected
 * to the configured callback URL with an authorization code.
 *
 * @returns The onboarding URL to redirect the merchant to
 */
export async function setupMollieConnectAccount(
	input: SetupMollieAccountInput,
): Promise<SetupMollieAccountOutput> {
	mollieLogger.info(
		{ merchantId: input.merchantId, email: input.email },
		"Starting Mollie Connect account setup",
	);

	// Check if merchant already has a Mollie organization
	const merchant = await db.query.merchants.findFirst({
		where: eq(merchants.id, input.merchantId),
		columns: {
			id: true,
			mollieOrganizationId: true,
		},
	});

	if (!merchant) {
		throw new Error("Merchant not found");
	}

	if (merchant.mollieOrganizationId) {
		throw new Error(
			"Merchant already has a Mollie organization. Use getMollieDashboardUrl instead.",
		);
	}

	// Create client link for onboarding
	const { clientLinkId, onboardingUrl } = await createClientLink({
		name: input.name,
		email: input.email,
		state: input.state,
	});

	mollieLogger.info(
		{ merchantId: input.merchantId, clientLinkId },
		"Created Mollie client link",
	);

	return {
		clientLinkId,
		onboardingUrl,
	};
}

export type RefreshMollieStatusInput = {
	merchantId: string;
};

export type RefreshMollieStatusOutput = {
	canReceivePayments: boolean;
	canReceiveSettlements: boolean;
	status: string;
	dashboardUrl?: string;
};

/**
 * Refresh Mollie account status from Mollie API.
 *
 * Uses the merchant's OAuth token to fetch onboarding status
 * and updates the database accordingly.
 *
 * @returns The current onboarding status
 */
export async function refreshMollieAccountStatus(
	input: RefreshMollieStatusInput,
): Promise<RefreshMollieStatusOutput> {
	mollieLogger.info(
		{ merchantId: input.merchantId },
		"Refreshing Mollie account status",
	);

	// Get merchant's Mollie client - this handles token refresh automatically
	// and updates the database with fresh tokens if needed
	await getMerchantMollieClient(input.merchantId);

	// After the client is retrieved (and tokens potentially refreshed),
	// get the fresh access token for the onboarding API call
	const merchant = await db.query.merchants.findFirst({
		where: eq(merchants.id, input.merchantId),
		columns: {
			id: true,
			mollieAccessToken: true,
		},
	});

	if (!merchant?.mollieAccessToken) {
		throw new Error("Mollie tokens not configured");
	}

	// Import crypto to decrypt token
	const { decryptToken } = await import("../../lib/crypto.js");
	const accessToken = await decryptToken(merchant.mollieAccessToken);

	// Fetch onboarding status
	const status = await getOnboardingStatus(accessToken);

	// Update merchant record
	await db
		.update(merchants)
		.set({
			mollieOnboardingStatus: status.status as
				| "needs-data"
				| "in-review"
				| "completed",
			mollieCanReceivePayments: status.canReceivePayments,
			mollieCanReceiveSettlements: status.canReceiveSettlements,
		})
		.where(eq(merchants.id, input.merchantId));

	mollieLogger.info(
		{
			merchantId: input.merchantId,
			status: status.status,
			canReceivePayments: status.canReceivePayments,
		},
		"Mollie account status refreshed",
	);

	return status;
}

/**
 * Get the Mollie dashboard URL for a merchant.
 *
 * The dashboard URL allows merchants to manage their Mollie account,
 * view transactions, configure settings, etc.
 *
 * @returns The dashboard URL
 */
export async function getMollieDashboardUrl(
	merchantId: string,
): Promise<string | undefined> {
	mollieLogger.info({ merchantId }, "Getting Mollie dashboard URL");

	// Get the access token
	const merchant = await db.query.merchants.findFirst({
		where: eq(merchants.id, merchantId),
		columns: {
			id: true,
			mollieAccessToken: true,
		},
	});

	if (!merchant?.mollieAccessToken) {
		throw new Error("Mollie tokens not configured");
	}

	const { decryptToken } = await import("../../lib/crypto.js");
	const accessToken = await decryptToken(merchant.mollieAccessToken);

	// Fetch onboarding status which includes dashboard URL
	const status = await getOnboardingStatus(accessToken);

	return status.dashboardUrl;
}

/**
 * Enable default payment methods for a merchant's Mollie profile.
 *
 * Called after OAuth completion to set up standard payment methods
 * (credit card, Apple Pay, etc.)
 */
export async function enableMolliePaymentMethods(merchantId: string): Promise<{
	enabled: string[];
	failed: Array<{ method: string; error: string }>;
}> {
	mollieLogger.info({ merchantId }, "Enabling Mollie payment methods");

	// Get merchant profile ID
	const merchant = await db.query.merchants.findFirst({
		where: eq(merchants.id, merchantId),
		columns: {
			id: true,
			mollieProfileId: true,
		},
	});

	if (!merchant?.mollieProfileId) {
		throw new Error("Mollie profile not configured");
	}

	// Get merchant's Mollie client
	const mollieClient = await getMerchantMollieClient(merchantId);

	// Enable default payment methods
	const result = await enableDefaultPaymentMethods(
		mollieClient,
		merchant.mollieProfileId,
	);

	mollieLogger.info(
		{
			merchantId,
			enabled: result.enabled,
			failedCount: result.failed.length,
		},
		"Mollie payment methods setup completed",
	);

	return result;
}

/**
 * Cleanup failed Mollie account connection.
 *
 * Clears Mollie-related fields from the merchant record.
 * Note: Cannot actually delete the Mollie organization as it's
 * owned by the merchant in Mollie's system.
 */
export async function cleanupMollieConnection(
	merchantId: string,
): Promise<void> {
	mollieLogger.info({ merchantId }, "Cleaning up Mollie connection");

	await db
		.update(merchants)
		.set({
			mollieOrganizationId: null,
			mollieProfileId: null,
			mollieAccessToken: null,
			mollieRefreshToken: null,
			mollieTokenExpiresAt: null,
			mollieOnboardingStatus: null,
			mollieCanReceivePayments: false,
			mollieCanReceiveSettlements: false,
		})
		.where(eq(merchants.id, merchantId));

	mollieLogger.info({ merchantId }, "Mollie connection cleaned up");
}
