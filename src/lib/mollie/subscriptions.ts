import type { Mandate, Payment, Subscription } from "@mollie/api-client";
import { SequenceType } from "@mollie/api-client";
import { mollieLogger } from "@/lib/logger";
import { getMollieClient } from "./client";
import type { Amount } from "./types";

// ============================================================================
// Types
// ============================================================================

export type CreateFirstPaymentInput = {
	customerId: string;
	amount: Amount;
	description: string;
	redirectUrl: string;
	webhookUrl: string;
	metadata?: Record<string, string>;
};

export type CreateSubscriptionInput = {
	customerId: string;
	amount: Amount;
	interval: string; // e.g., "1 month", "1 week", "12 months"
	description: string;
	webhookUrl: string;
	metadata?: Record<string, string>;
	startDate?: string; // ISO date string, defaults to mandate creation date
};

// ============================================================================
// First Payment (Mandate Creation)
// ============================================================================

/**
 * Create a first payment to establish a mandate for recurring payments.
 *
 * Mollie subscription flow:
 * 1. Create first payment with sequenceType: "first" -> creates mandate
 * 2. Customer completes payment (redirect to checkout)
 * 3. Webhook confirms payment -> mandate becomes "valid"
 * 4. Create subscription using the valid mandate
 *
 * @param input - Payment creation parameters
 * @returns The payment object with checkout URL for redirect
 */
export async function createFirstPaymentForMandate(
	input: CreateFirstPaymentInput,
): Promise<Payment> {
	mollieLogger.info(
		{ customerId: input.customerId, amount: input.amount },
		"Creating first payment for mandate",
	);

	try {
		const mollie = getMollieClient();

		const payment = await mollie.payments.create({
			customerId: input.customerId,
			amount: input.amount,
			description: input.description,
			redirectUrl: input.redirectUrl,
			webhookUrl: input.webhookUrl,
			sequenceType: SequenceType.first, // Creates a mandate
			metadata: input.metadata,
		});

		mollieLogger.info(
			{
				customerId: input.customerId,
				paymentId: payment.id,
				checkoutUrl: payment._links.checkout?.href,
			},
			"First payment created successfully",
		);

		return payment;
	} catch (error) {
		mollieLogger.error(
			{
				customerId: input.customerId,
				error: error instanceof Error ? error.message : String(error),
			},
			"Failed to create first payment for mandate",
		);
		throw error;
	}
}

// ============================================================================
// Subscriptions
// ============================================================================

/**
 * Create a subscription for recurring payments.
 *
 * Prerequisites:
 * - Customer must have a valid mandate (created via first payment)
 * - Call getMandates() to verify mandate status is "valid" before creating
 *
 * @param input - Subscription creation parameters
 * @returns The subscription object
 */
export async function createSubscription(
	input: CreateSubscriptionInput,
): Promise<Subscription> {
	mollieLogger.info(
		{
			customerId: input.customerId,
			amount: input.amount,
			interval: input.interval,
		},
		"Creating subscription",
	);

	try {
		const mollie = getMollieClient();

		const subscription = await mollie.customerSubscriptions.create({
			customerId: input.customerId,
			amount: input.amount,
			interval: input.interval,
			description: input.description,
			webhookUrl: input.webhookUrl,
			metadata: input.metadata,
			startDate: input.startDate,
		});

		mollieLogger.info(
			{
				customerId: input.customerId,
				subscriptionId: subscription.id,
				status: subscription.status,
				nextPaymentDate: subscription.nextPaymentDate,
			},
			"Subscription created successfully",
		);

		return subscription;
	} catch (error) {
		mollieLogger.error(
			{
				customerId: input.customerId,
				interval: input.interval,
				error: error instanceof Error ? error.message : String(error),
			},
			"Failed to create subscription",
		);
		throw error;
	}
}

/**
 * Get a subscription by ID.
 *
 * @param customerId - The Mollie customer ID (cst_xxx)
 * @param subscriptionId - The Mollie subscription ID (sub_xxx)
 * @returns The subscription object
 */
export async function getSubscription(
	customerId: string,
	subscriptionId: string,
): Promise<Subscription> {
	const mollie = getMollieClient();
	return mollie.customerSubscriptions.get(subscriptionId, { customerId });
}

/**
 * Cancel a subscription.
 *
 * Cancellation takes effect immediately. No more payments will be collected.
 * Already collected payments are not refunded.
 *
 * @param customerId - The Mollie customer ID (cst_xxx)
 * @param subscriptionId - The Mollie subscription ID (sub_xxx)
 * @returns The canceled subscription object
 */
export async function cancelSubscription(
	customerId: string,
	subscriptionId: string,
): Promise<Subscription> {
	mollieLogger.info({ customerId, subscriptionId }, "Canceling subscription");

	try {
		const mollie = getMollieClient();

		const subscription = await mollie.customerSubscriptions.cancel(
			subscriptionId,
			{ customerId },
		);

		mollieLogger.info(
			{
				customerId,
				subscriptionId,
				status: subscription.status,
			},
			"Subscription canceled successfully",
		);

		return subscription;
	} catch (error) {
		mollieLogger.error(
			{
				customerId,
				subscriptionId,
				error: error instanceof Error ? error.message : String(error),
			},
			"Failed to cancel subscription",
		);
		throw error;
	}
}

// ============================================================================
// Mandates
// ============================================================================

/**
 * Get all mandates for a customer.
 *
 * Mandate statuses:
 * - "valid": Can be used for recurring payments
 * - "pending": First payment not yet completed
 * - "invalid": Payment failed or was revoked
 *
 * @param customerId - The Mollie customer ID (cst_xxx)
 * @returns List of mandates for the customer
 */
export async function getMandates(customerId: string): Promise<Mandate[]> {
	const mollie = getMollieClient();
	const mandates = await mollie.customerMandates.page({ customerId });

	// Convert iterator to array
	const mandateList: Mandate[] = [];
	for (const mandate of mandates) {
		mandateList.push(mandate);
	}

	return mandateList;
}

/**
 * Get a specific mandate by ID.
 *
 * @param customerId - The Mollie customer ID (cst_xxx)
 * @param mandateId - The Mollie mandate ID (mdt_xxx)
 * @returns The mandate object
 */
export async function getMandate(
	customerId: string,
	mandateId: string,
): Promise<Mandate> {
	const mollie = getMollieClient();
	return mollie.customerMandates.get(mandateId, { customerId });
}

/**
 * Check if a customer has a valid mandate for recurring payments.
 *
 * @param customerId - The Mollie customer ID (cst_xxx)
 * @returns true if the customer has at least one valid mandate
 */
export async function hasValidMandate(customerId: string): Promise<boolean> {
	const mandates = await getMandates(customerId);
	return mandates.some((mandate) => mandate.status === "valid");
}

/**
 * Revoke (delete) a mandate.
 *
 * This will cancel any subscriptions using this mandate.
 *
 * @param customerId - The Mollie customer ID (cst_xxx)
 * @param mandateId - The Mollie mandate ID (mdt_xxx)
 * @returns true if revocation was successful
 */
export async function revokeMandate(
	customerId: string,
	mandateId: string,
): Promise<boolean> {
	mollieLogger.info({ customerId, mandateId }, "Revoking mandate");

	try {
		const mollie = getMollieClient();
		await mollie.customerMandates.revoke(mandateId, { customerId });

		mollieLogger.info(
			{ customerId, mandateId },
			"Mandate revoked successfully",
		);

		return true;
	} catch (error) {
		mollieLogger.error(
			{
				customerId,
				mandateId,
				error: error instanceof Error ? error.message : String(error),
			},
			"Failed to revoke mandate",
		);
		throw error;
	}
}
