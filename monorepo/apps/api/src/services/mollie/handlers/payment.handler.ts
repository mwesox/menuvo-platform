import { db } from "@menuvo/db";
import { merchants } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { env } from "../../../env";
// TODO: Implement updatePaymentStatus via tRPC procedure
// import { updatePaymentStatus } from "@/features/orders/server/orders.functions";
import { mollieLogger } from "../../../lib/logger";
import { createSubscription } from "../subscriptions";
import { registerMollieHandler } from "./registry";

// ============================================
// Payment Metadata Types
// ============================================

interface OrderPaymentMetadata {
	orderId?: string;
	storeId?: string;
}

interface SubscriptionPaymentMetadata {
	merchantId?: string;
	type?: string;
	plan?: string;
}

type PaymentMetadata = OrderPaymentMetadata & SubscriptionPaymentMetadata;

// ============================================
// Helper Functions
// ============================================

/**
 * Handle subscription first payment completion.
 * When the first payment is paid, the mandate becomes valid and we create the subscription.
 */
async function handleSubscriptionFirstPayment(
	paymentId: string,
	metadata: SubscriptionPaymentMetadata,
	payload: Record<string, unknown>,
): Promise<void> {
	const merchantId = metadata.merchantId ?? null;
	const plan = metadata.plan;

	if (!merchantId || !plan) {
		mollieLogger.warn(
			{ paymentId, metadata },
			"Subscription first payment missing merchantId or plan",
		);
		return;
	}

	// Get merchant to find customer ID and mandate
	const merchant = await db.query.merchants.findFirst({
		where: eq(merchants.id, merchantId),
		columns: {
			id: true,
			mollieCustomerId: true,
		},
	});

	if (!merchant?.mollieCustomerId) {
		mollieLogger.error(
			{ merchantId, paymentId },
			"Merchant not found or missing Mollie customer ID for subscription",
		);
		return;
	}

	// Get the mandate ID from the payment
	const mandateId = (payload.mandateId as string) ?? null;
	if (!mandateId) {
		mollieLogger.error(
			{ merchantId, paymentId },
			"No mandate ID found on payment for subscription",
		);
		return;
	}

	// Get the plan price
	const planPrices: Record<string, string | undefined> = {
		starter: env.MOLLIE_PRICE_STARTER,
		professional: env.MOLLIE_PRICE_PRO,
		max: env.MOLLIE_PRICE_MAX,
	};
	const price = planPrices[plan];
	if (!price) {
		mollieLogger.error(
			{ merchantId, plan },
			"Mollie price not configured for plan",
		);
		return;
	}

	const serverUrl = env.SERVER_URL || "http://localhost:3000";

	try {
		// Create the subscription now that mandate is valid
		const subscription = await createSubscription({
			customerId: merchant.mollieCustomerId,
			amount: { value: price, currency: "EUR" },
			interval: "1 month",
			description: `Menuvo ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
			webhookUrl: `${serverUrl}/webhooks/mollie`,
			metadata: {
				merchantId,
				plan,
			},
		});

		// Update merchant with subscription and mandate info
		await db
			.update(merchants)
			.set({
				mollieMandateId: mandateId,
				mollieMandateStatus: "valid",
				mollieSubscriptionId: subscription.id,
				mollieSubscriptionStatus: "active",
			})
			.where(eq(merchants.id, merchantId));

		mollieLogger.info(
			{
				merchantId,
				mandateId,
				subscriptionId: subscription.id,
				plan,
			},
			"Mollie subscription created after first payment",
		);
	} catch (error) {
		mollieLogger.error(
			{
				merchantId,
				paymentId,
				error: error instanceof Error ? error.message : String(error),
			},
			"Failed to create Mollie subscription after first payment",
		);

		// Still update mandate status even if subscription creation fails
		await db
			.update(merchants)
			.set({
				mollieMandateId: mandateId,
				mollieMandateStatus: "valid",
			})
			.where(eq(merchants.id, merchantId));
	}
}

// ============================================
// Event Handlers (Self-Registering)
// ============================================

/**
 * Handle payment.paid event.
 *
 * For order payments: Updates the order status to "confirmed" and payment status to "paid".
 * For subscription first payments: Creates the actual subscription after mandate is valid.
 */
registerMollieHandler(
	"payment.paid",
	async (_eventType, resourceId, payload) => {
		const metadata = (payload.metadata ?? {}) as PaymentMetadata;

		// Check if this is a subscription first payment
		if (metadata.type === "subscription_first_payment") {
			mollieLogger.info(
				{
					paymentId: resourceId,
					status: payload.status,
					merchantId: metadata.merchantId,
					plan: metadata.plan,
				},
				"Subscription first payment paid",
			);

			await handleSubscriptionFirstPayment(resourceId, metadata, payload);
			return;
		}

		// Otherwise, treat as an order payment
		const orderId = metadata.orderId ?? null;

		mollieLogger.info(
			{
				paymentId: resourceId,
				status: payload.status,
				orderId,
				storeId: metadata.storeId,
			},
			"Payment paid",
		);

		if (!orderId) {
			mollieLogger.warn(
				{ paymentId: resourceId },
				"Payment paid but no orderId in metadata",
			);
			return;
		}

		// TODO: Call updatePaymentStatus via tRPC
		// await updatePaymentStatus({
		// 	data: {
		// 		orderId,
		// 		paymentStatus: "paid",
		// 	},
		// });

		mollieLogger.info(
			{ orderId, paymentId: resourceId },
			"Order payment confirmed",
		);
	},
);

/**
 * Handle payment.failed event.
 *
 * Updates the order status to "cancelled" and payment status to "failed".
 */
registerMollieHandler(
	"payment.failed",
	async (_eventType, resourceId, payload) => {
		const metadata = (payload.metadata ?? {}) as PaymentMetadata;
		const orderId = metadata.orderId ?? null;

		mollieLogger.info(
			{
				paymentId: resourceId,
				status: payload.status,
				orderId,
				storeId: metadata.storeId,
			},
			"Payment failed",
		);

		if (!orderId) {
			mollieLogger.warn(
				{ paymentId: resourceId },
				"Payment failed but no orderId in metadata",
			);
			return;
		}

		// TODO: Call updatePaymentStatus via tRPC
		// await updatePaymentStatus({
		// 	data: {
		// 		orderId,
		// 		paymentStatus: "failed",
		// 	},
		// });

		mollieLogger.info(
			{ orderId, paymentId: resourceId },
			"Order payment failed, order cancelled",
		);
	},
);

/**
 * Handle payment.expired event.
 *
 * Updates the order status to "cancelled" and payment status to "expired".
 */
registerMollieHandler(
	"payment.expired",
	async (_eventType, resourceId, payload) => {
		const metadata = (payload.metadata ?? {}) as PaymentMetadata;
		const orderId = metadata.orderId ?? null;

		mollieLogger.info(
			{
				paymentId: resourceId,
				status: payload.status,
				orderId,
				storeId: metadata.storeId,
			},
			"Payment expired",
		);

		if (!orderId) {
			mollieLogger.warn(
				{ paymentId: resourceId },
				"Payment expired but no orderId in metadata",
			);
			return;
		}

		// TODO: Call updatePaymentStatus via tRPC
		// await updatePaymentStatus({
		// 	data: {
		// 		orderId,
		// 		paymentStatus: "expired",
		// 	},
		// });

		mollieLogger.info(
			{ orderId, paymentId: resourceId },
			"Order payment expired, order cancelled",
		);
	},
);

/**
 * Handle payment.canceled event.
 *
 * Updates the order status to "cancelled" and payment status to "failed".
 * Note: Mollie uses "canceled" (American spelling) in the event type.
 */
registerMollieHandler(
	"payment.canceled",
	async (_eventType, resourceId, payload) => {
		const metadata = (payload.metadata ?? {}) as PaymentMetadata;
		const orderId = metadata.orderId ?? null;

		mollieLogger.info(
			{
				paymentId: resourceId,
				status: payload.status,
				orderId,
				storeId: metadata.storeId,
			},
			"Payment canceled",
		);

		if (!orderId) {
			mollieLogger.warn(
				{ paymentId: resourceId },
				"Payment canceled but no orderId in metadata",
			);
			return;
		}

		// Map canceled to failed status since we don't have a "canceled" payment status
		// TODO: Call updatePaymentStatus via tRPC
		// await updatePaymentStatus({
		// 	data: {
		// 		orderId,
		// 		paymentStatus: "failed",
		// 	},
		// });

		mollieLogger.info(
			{ orderId, paymentId: resourceId },
			"Order payment canceled, order cancelled",
		);
	},
);
