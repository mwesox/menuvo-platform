import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
	merchants,
	type PaymentCapabilitiesStatus,
	type PaymentRequirementsStatus,
} from "@/db/schema";

export type UpdatePaymentStatusInput = {
	paymentAccountId: string;
	onboardingComplete?: boolean;
	capabilitiesStatus?: PaymentCapabilitiesStatus;
	requirementsStatus?: PaymentRequirementsStatus;
};

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
		console.warn("No merchant found for payment account", {
			paymentAccountId: input.paymentAccountId,
		});
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

	console.info("Updated merchant payment status", {
		merchantId: merchant.id,
		paymentAccountId: input.paymentAccountId,
		onboardingComplete: input.onboardingComplete,
		capabilitiesStatus: input.capabilitiesStatus,
		requirementsStatus: input.requirementsStatus,
	});

	return merchant.id;
}

/**
 * Map Stripe requirements status to our enum.
 */
export function mapRequirementsStatus(
	stripeStatus: string | undefined,
): PaymentRequirementsStatus {
	switch (stripeStatus) {
		case "past_due":
			return "past_due";
		case "currently_due":
			return "currently_due";
		case "pending_verification":
			return "pending_verification";
		default:
			return "none";
	}
}

/**
 * Map Stripe capability status to our enum.
 */
export function mapCapabilityStatus(
	stripeStatus: string | undefined,
): PaymentCapabilitiesStatus {
	switch (stripeStatus) {
		case "active":
			return "active";
		case "pending":
			return "pending";
		default:
			return "inactive";
	}
}
