import { eq } from "drizzle-orm";
import { db } from "@/db";
import type {
	PaymentCapabilitiesStatus,
	PaymentRequirementsStatus,
} from "@/db/schema";
import { merchants } from "@/db/schema";
import { stripeLogger } from "@/lib/logger";
import { getStripeClient } from "../client";
import { parseV2AccountStatus } from "../v2-account";
import { registerV2Handler } from "./registry";

// ============================================
// Types
// ============================================

export type UpdatePaymentStatusInput = {
	paymentAccountId: string;
	onboardingComplete?: boolean;
	capabilitiesStatus?: PaymentCapabilitiesStatus;
	requirementsStatus?: PaymentRequirementsStatus;
};

// ============================================
// Helper Functions
// ============================================

/**
 * Find a merchant by their Stripe payment account ID.
 */
async function findMerchantByPaymentAccountId(
	paymentAccountId: string,
): Promise<{ id: number } | null> {
	const result = await db
		.select({ id: merchants.id })
		.from(merchants)
		.where(eq(merchants.paymentAccountId, paymentAccountId))
		.limit(1);

	return result[0] ?? null;
}

/**
 * Update a merchant's payment status based on Stripe webhook events.
 *
 * Called when we receive account status updates from Stripe.
 * Finds the merchant by their Stripe account ID and updates the relevant fields.
 *
 * @returns The merchant ID if found and updated, null if no merchant found
 */
export async function updateMerchantPaymentStatus(
	input: UpdatePaymentStatusInput,
): Promise<number | null> {
	// Find merchant by Stripe account ID
	const merchant = await findMerchantByPaymentAccountId(input.paymentAccountId);
	if (!merchant) {
		stripeLogger.warn(
			{ paymentAccountId: input.paymentAccountId },
			"No merchant found for payment account",
		);
		return null;
	}

	// Build update object with only defined fields
	const updateData: Record<string, unknown> = {};

	if (input.onboardingComplete !== undefined) {
		updateData.paymentOnboardingComplete = input.onboardingComplete;
	}
	if (input.capabilitiesStatus !== undefined) {
		updateData.paymentCapabilitiesStatus = input.capabilitiesStatus;
	}
	if (input.requirementsStatus !== undefined) {
		updateData.paymentRequirementsStatus = input.requirementsStatus;
	}

	// Update merchant
	await db
		.update(merchants)
		.set(updateData)
		.where(eq(merchants.id, merchant.id));

	stripeLogger.info(
		{
			merchantId: merchant.id,
			paymentAccountId: input.paymentAccountId,
			onboardingComplete: input.onboardingComplete,
			capabilitiesStatus: input.capabilitiesStatus,
			requirementsStatus: input.requirementsStatus,
		},
		"Updated merchant payment status",
	);

	return merchant.id;
}

// ============================================
// V2 Account Event Handler (shared logic)
// ============================================

/**
 * Handle V2 account events by fetching full account data from Stripe.
 *
 * V2 thin events only contain minimal data (event ID + related object reference).
 * We need to fetch the full account data from Stripe to process the event.
 */
async function handleAccountEvent(
	eventType: string,
	payload: Record<string, unknown>,
): Promise<void> {
	// V2 thin events have related_object with account ID
	const relatedObject = payload.related_object as { id?: string } | undefined;
	const accountId = relatedObject?.id;

	if (!accountId) {
		stripeLogger.error({ eventType }, "No account ID in V2 thin event");
		return;
	}

	stripeLogger.info({ accountId, eventType }, "Handling V2 account event");

	// Fetch full account data from Stripe
	const stripe = getStripeClient();
	const account = await stripe.v2.core.accounts.retrieve(accountId, {
		include: ["requirements", "configuration.merchant"],
	});

	// Parse and update merchant status
	const { requirementsStatus, capabilitiesStatus, onboardingComplete } =
		parseV2AccountStatus(account);

	await updateMerchantPaymentStatus({
		paymentAccountId: accountId,
		onboardingComplete,
		requirementsStatus,
		capabilitiesStatus,
	});

	stripeLogger.info(
		{ accountId, requirementsStatus, capabilitiesStatus, onboardingComplete },
		"Account status updated",
	);
}

// ============================================
// Event Handlers (Self-Registering)
// ============================================

/**
 * Handle v2.core.account[requirements].updated event.
 *
 * Triggered when account requirements change (new documents needed, etc.).
 */
registerV2Handler(
	"v2.core.account[requirements].updated",
	async (eventType, payload) => {
		await handleAccountEvent(eventType, payload);
	},
);

/**
 * Handle v2.core.account[configuration.merchant].capability_status_updated event.
 *
 * Triggered when payment capabilities status changes.
 */
registerV2Handler(
	"v2.core.account[configuration.merchant].capability_status_updated",
	async (eventType, payload) => {
		await handleAccountEvent(eventType, payload);
	},
);
