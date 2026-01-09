import { db } from "@menuvo/db";
import { type MollieSubscriptionStatus, merchants } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { mollieLogger } from "../../../lib/logger";
import { registerMollieHandler } from "./registry";

// ============================================
// Types
// ============================================

/**
 * Mollie subscription payload structure.
 * This is the full subscription object fetched from Mollie API.
 */
interface MollieSubscription {
	id: string; // sub_xxx
	customerId: string; // cst_xxx
	status: "pending" | "active" | "canceled" | "suspended" | "completed";
	metadata?: Record<string, string>;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Find a merchant by their Mollie customer ID.
 */
async function findMerchantByMollieCustomerId(
	customerId: string,
): Promise<{ id: string } | null> {
	const result = await db
		.select({ id: merchants.id })
		.from(merchants)
		.where(eq(merchants.mollieCustomerId, customerId))
		.limit(1);

	return result[0] ?? null;
}

/**
 * Update merchant's Mollie subscription fields.
 */
async function updateMerchantSubscription(
	merchantId: string,
	subscriptionId: string,
	status: MollieSubscriptionStatus,
): Promise<void> {
	await db
		.update(merchants)
		.set({
			mollieSubscriptionId: subscriptionId,
			mollieSubscriptionStatus: status,
		})
		.where(eq(merchants.id, merchantId));
}

// ============================================
// Event Handlers (Self-Registering)
// ============================================

/**
 * Handle subscription.created event.
 *
 * Called when a new Mollie subscription is created.
 * Updates the merchant's subscription fields with active status.
 */
registerMollieHandler(
	"subscription.created",
	async (_eventType, _resourceId, payload) => {
		const subscription = payload as unknown as MollieSubscription;

		mollieLogger.info(
			{ subscriptionId: subscription.id, customerId: subscription.customerId },
			"Subscription created",
		);

		const merchant = await findMerchantByMollieCustomerId(
			subscription.customerId,
		);

		if (!merchant) {
			mollieLogger.debug(
				{
					subscriptionId: subscription.id,
					customerId: subscription.customerId,
				},
				"No merchant found for subscription - may be pending onboarding",
			);
			return;
		}

		await updateMerchantSubscription(merchant.id, subscription.id, "active");

		mollieLogger.info(
			{
				merchantId: merchant.id,
				subscriptionId: subscription.id,
				status: "active",
			},
			"Updated merchant subscription (created)",
		);
	},
);

/**
 * Handle subscription.updated event.
 *
 * Called when a subscription is modified.
 * Syncs the subscription status to our merchant record.
 */
registerMollieHandler(
	"subscription.updated",
	async (_eventType, _resourceId, payload) => {
		const subscription = payload as unknown as MollieSubscription;

		mollieLogger.info(
			{
				subscriptionId: subscription.id,
				customerId: subscription.customerId,
				status: subscription.status,
			},
			"Subscription updated",
		);

		const merchant = await findMerchantByMollieCustomerId(
			subscription.customerId,
		);

		if (!merchant) {
			mollieLogger.debug(
				{
					subscriptionId: subscription.id,
					customerId: subscription.customerId,
				},
				"No merchant found for subscription",
			);
			return;
		}

		// Map Mollie status to our enum (they match exactly)
		const status = subscription.status as MollieSubscriptionStatus;

		await updateMerchantSubscription(merchant.id, subscription.id, status);

		mollieLogger.info(
			{
				merchantId: merchant.id,
				subscriptionId: subscription.id,
				status,
			},
			"Updated merchant subscription (updated)",
		);
	},
);

/**
 * Handle subscription.canceled event.
 *
 * Called when a subscription is canceled.
 * Marks the merchant subscription as canceled.
 */
registerMollieHandler(
	"subscription.canceled",
	async (_eventType, _resourceId, payload) => {
		const subscription = payload as unknown as MollieSubscription;

		mollieLogger.info(
			{ subscriptionId: subscription.id, customerId: subscription.customerId },
			"Subscription canceled",
		);

		const merchant = await findMerchantByMollieCustomerId(
			subscription.customerId,
		);

		if (!merchant) {
			mollieLogger.debug(
				{
					subscriptionId: subscription.id,
					customerId: subscription.customerId,
				},
				"No merchant found for subscription",
			);
			return;
		}

		await updateMerchantSubscription(merchant.id, subscription.id, "canceled");

		mollieLogger.info(
			{
				merchantId: merchant.id,
				subscriptionId: subscription.id,
			},
			"Marked merchant subscription as canceled",
		);
	},
);

/**
 * Handle subscription.suspended event.
 *
 * Called when a subscription is suspended (e.g., payment failed).
 * Restricts merchant access until payment method is updated.
 */
registerMollieHandler(
	"subscription.suspended",
	async (_eventType, _resourceId, payload) => {
		const subscription = payload as unknown as MollieSubscription;

		mollieLogger.info(
			{ subscriptionId: subscription.id, customerId: subscription.customerId },
			"Subscription suspended",
		);

		const merchant = await findMerchantByMollieCustomerId(
			subscription.customerId,
		);

		if (!merchant) {
			mollieLogger.debug(
				{
					subscriptionId: subscription.id,
					customerId: subscription.customerId,
				},
				"No merchant found for subscription",
			);
			return;
		}

		await updateMerchantSubscription(merchant.id, subscription.id, "suspended");

		mollieLogger.info(
			{
				merchantId: merchant.id,
				subscriptionId: subscription.id,
			},
			"Marked merchant subscription as suspended",
		);
	},
);

/**
 * Handle subscription.resumed event.
 *
 * Called when a suspended subscription is resumed (payment method updated).
 * Restores merchant access.
 */
registerMollieHandler(
	"subscription.resumed",
	async (_eventType, _resourceId, payload) => {
		const subscription = payload as unknown as MollieSubscription;

		mollieLogger.info(
			{ subscriptionId: subscription.id, customerId: subscription.customerId },
			"Subscription resumed",
		);

		const merchant = await findMerchantByMollieCustomerId(
			subscription.customerId,
		);

		if (!merchant) {
			mollieLogger.debug(
				{
					subscriptionId: subscription.id,
					customerId: subscription.customerId,
				},
				"No merchant found for subscription",
			);
			return;
		}

		await updateMerchantSubscription(merchant.id, subscription.id, "active");

		mollieLogger.info(
			{
				merchantId: merchant.id,
				subscriptionId: subscription.id,
				status: "active",
			},
			"Marked merchant subscription as resumed (active)",
		);
	},
);
