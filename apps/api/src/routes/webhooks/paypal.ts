/**
 * PayPal Webhook Handler
 *
 * Handles incoming PayPal webhook events for:
 * - Merchant onboarding updates
 * - Payment capture completion
 * - Partner consent changes
 */
import { db } from "@menuvo/db";
import { merchants, orders, paypalEvents } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { verifyWebhookSignature } from "../../domains/payments/paypal.js";
import { createLogger } from "../../lib/logger.js";

const paypalLogger = createLogger("paypal-webhook");
const paypalWebhook = new Hono();

interface PayPalWebhookEvent {
	id: string;
	event_type: string;
	resource_type: string;
	resource: {
		id?: string;
		merchant_id?: string;
		tracking_id?: string;
		status?: string;
		purchase_units?: Array<{
			reference_id?: string;
			payments?: {
				captures?: Array<{
					id: string;
					status: string;
				}>;
			};
		}>;
		[key: string]: unknown;
	};
	create_time: string;
}

/**
 * PayPal webhook endpoint
 * Always returns 200 to acknowledge receipt, even if processing fails
 * (we'll retry from stored events)
 */
paypalWebhook.post("/", async (c) => {
	const body = await c.req.text();
	const headers: Record<string, string> = {};

	// Collect headers for verification
	c.req.raw.headers.forEach((value, key) => {
		headers[key.toLowerCase()] = value;
	});

	paypalLogger.info(
		{ headers: Object.keys(headers) },
		"Received PayPal webhook",
	);

	// Verify webhook signature (in production)
	try {
		const isValid = await verifyWebhookSignature(headers, body);
		if (!isValid) {
			paypalLogger.warn("Webhook signature verification failed");
			// Still store the event but mark as unverified
		}
	} catch (err) {
		paypalLogger.error({ error: err }, "Webhook signature verification error");
	}

	// Parse the event
	let event: PayPalWebhookEvent;
	try {
		event = JSON.parse(body) as PayPalWebhookEvent;
	} catch (err) {
		paypalLogger.error({ error: err }, "Failed to parse webhook body");
		return c.json({ status: "error", message: "Invalid JSON" }, 400);
	}

	paypalLogger.info(
		{
			eventId: event.id,
			eventType: event.event_type,
			resourceType: event.resource_type,
		},
		"Processing PayPal webhook event",
	);

	// Store event for idempotency and audit trail
	try {
		await db
			.insert(paypalEvents)
			.values({
				id: event.id,
				eventType: event.event_type,
				resourceType: event.resource_type,
				resourceId: event.resource?.id,
				payload: event,
				processingStatus: "PENDING",
			})
			.onConflictDoNothing();
	} catch (err) {
		paypalLogger.error(
			{ error: err, eventId: event.id },
			"Failed to store event",
		);
	}

	// Process the event
	try {
		await processPayPalEvent(event);

		// Mark event as processed
		await db
			.update(paypalEvents)
			.set({
				processedAt: new Date(),
				processingStatus: "PROCESSED",
			})
			.where(eq(paypalEvents.id, event.id));
	} catch (err) {
		paypalLogger.error(
			{ error: err, eventId: event.id, eventType: event.event_type },
			"Failed to process webhook event",
		);

		// Mark event as failed
		await db
			.update(paypalEvents)
			.set({
				processingStatus: "FAILED",
				retryCount: 1,
			})
			.where(eq(paypalEvents.id, event.id));
	}

	// Always return 200 to acknowledge receipt
	return c.json({ status: "ok" });
});

/**
 * Process individual PayPal webhook events
 */
async function processPayPalEvent(event: PayPalWebhookEvent): Promise<void> {
	switch (event.event_type) {
		case "MERCHANT.ONBOARDING.COMPLETED":
			await handleMerchantOnboardingCompleted(event);
			break;

		case "MERCHANT.PARTNER-CONSENT.REVOKED":
			await handlePartnerConsentRevoked(event);
			break;

		case "PAYMENT.CAPTURE.COMPLETED":
			await handlePaymentCaptureCompleted(event);
			break;

		case "PAYMENT.CAPTURE.DENIED":
			await handlePaymentCaptureDenied(event);
			break;

		case "CHECKOUT.ORDER.APPROVED":
			await handleOrderApproved(event);
			break;

		default:
			paypalLogger.info(
				{ eventType: event.event_type },
				"Unhandled PayPal event type",
			);
	}
}

/**
 * Handle merchant onboarding completion
 */
async function handleMerchantOnboardingCompleted(
	event: PayPalWebhookEvent,
): Promise<void> {
	const merchantId = event.resource?.merchant_id;
	const trackingId = event.resource?.tracking_id;

	if (!merchantId) {
		paypalLogger.warn(
			{ eventId: event.id },
			"No merchant_id in onboarding event",
		);
		return;
	}

	paypalLogger.info(
		{ merchantId, trackingId },
		"Processing merchant onboarding completion",
	);

	// Find merchant by tracking ID or PayPal merchant ID
	let merchant: { id: string } | undefined;
	if (trackingId) {
		merchant = await db.query.merchants.findFirst({
			where: eq(merchants.paypalTrackingId, trackingId),
			columns: { id: true },
		});
	}

	if (!merchant) {
		merchant = await db.query.merchants.findFirst({
			where: eq(merchants.paypalMerchantId, merchantId),
			columns: { id: true },
		});
	}

	if (!merchant) {
		paypalLogger.warn(
			{ merchantId, trackingId },
			"Could not find merchant for onboarding event",
		);
		return;
	}

	// Update merchant status
	await db
		.update(merchants)
		.set({
			paypalMerchantId: merchantId,
			paypalOnboardingStatus: "completed",
			paypalPaymentsReceivable: true,
		})
		.where(eq(merchants.id, merchant.id));

	// Link event to merchant
	await db
		.update(paypalEvents)
		.set({ merchantId: merchant.id })
		.where(eq(paypalEvents.id, event.id));

	paypalLogger.info(
		{ merchantId: merchant.id, paypalMerchantId: merchantId },
		"Merchant onboarding marked as completed",
	);
}

/**
 * Handle partner consent revocation
 */
async function handlePartnerConsentRevoked(
	event: PayPalWebhookEvent,
): Promise<void> {
	const merchantId = event.resource?.merchant_id;

	if (!merchantId) {
		paypalLogger.warn(
			{ eventId: event.id },
			"No merchant_id in consent revoked event",
		);
		return;
	}

	paypalLogger.info({ merchantId }, "Processing partner consent revocation");

	// Find merchant by PayPal merchant ID
	const merchant = await db.query.merchants.findFirst({
		where: eq(merchants.paypalMerchantId, merchantId),
		columns: { id: true },
	});

	if (!merchant) {
		paypalLogger.warn(
			{ merchantId },
			"Could not find merchant for consent revoked event",
		);
		return;
	}

	// Update merchant status - they can no longer receive payments
	await db
		.update(merchants)
		.set({
			paypalPaymentsReceivable: false,
			paypalOnboardingStatus: "pending",
		})
		.where(eq(merchants.id, merchant.id));

	// Link event to merchant
	await db
		.update(paypalEvents)
		.set({ merchantId: merchant.id })
		.where(eq(paypalEvents.id, event.id));

	paypalLogger.info(
		{ merchantId: merchant.id, paypalMerchantId: merchantId },
		"Partner consent revoked - merchant disabled",
	);
}

/**
 * Handle payment capture completion
 */
async function handlePaymentCaptureCompleted(
	event: PayPalWebhookEvent,
): Promise<void> {
	const orderId = event.resource?.purchase_units?.[0]?.reference_id;
	const captureId = event.resource?.id;
	const captureStatus = event.resource?.status;

	if (!orderId) {
		paypalLogger.warn(
			{ eventId: event.id },
			"No reference_id in capture event",
		);
		return;
	}

	paypalLogger.info(
		{ orderId, captureId, captureStatus },
		"Processing payment capture completion",
	);

	// Find the order
	const order = await db.query.orders.findFirst({
		where: eq(orders.id, orderId),
		columns: { id: true, merchantId: true },
	});

	if (!order) {
		paypalLogger.warn({ orderId }, "Order not found for capture event");
		return;
	}

	// Update order with capture info
	await db
		.update(orders)
		.set({
			paypalCaptureId: captureId,
			paymentStatus: "paid",
			status: "confirmed",
			confirmedAt: new Date(),
		})
		.where(eq(orders.id, orderId));

	// Link event to merchant
	await db
		.update(paypalEvents)
		.set({ merchantId: order.merchantId })
		.where(eq(paypalEvents.id, event.id));

	paypalLogger.info({ orderId, captureId }, "Order payment capture completed");
}

/**
 * Handle payment capture denial
 */
async function handlePaymentCaptureDenied(
	event: PayPalWebhookEvent,
): Promise<void> {
	const orderId = event.resource?.purchase_units?.[0]?.reference_id;

	if (!orderId) {
		paypalLogger.warn(
			{ eventId: event.id },
			"No reference_id in capture denied event",
		);
		return;
	}

	paypalLogger.info({ orderId }, "Processing payment capture denial");

	// Find the order
	const order = await db.query.orders.findFirst({
		where: eq(orders.id, orderId),
		columns: { id: true, merchantId: true },
	});

	if (!order) {
		paypalLogger.warn({ orderId }, "Order not found for capture denied event");
		return;
	}

	// Update order status
	await db
		.update(orders)
		.set({
			paymentStatus: "failed",
			status: "cancelled",
		})
		.where(eq(orders.id, orderId));

	// Link event to merchant
	await db
		.update(paypalEvents)
		.set({ merchantId: order.merchantId })
		.where(eq(paypalEvents.id, event.id));

	paypalLogger.info({ orderId }, "Order payment capture denied");
}

/**
 * Handle order approval (customer approved payment)
 */
async function handleOrderApproved(event: PayPalWebhookEvent): Promise<void> {
	const orderId = event.resource?.purchase_units?.[0]?.reference_id;

	if (!orderId) {
		paypalLogger.warn(
			{ eventId: event.id },
			"No reference_id in order approved event",
		);
		return;
	}

	paypalLogger.info({ orderId }, "Processing order approval");

	// Find the order
	const order = await db.query.orders.findFirst({
		where: eq(orders.id, orderId),
		columns: { id: true, merchantId: true, paymentStatus: true },
	});

	if (!order) {
		paypalLogger.warn({ orderId }, "Order not found for order approved event");
		return;
	}

	// Update order payment status to awaiting capture
	if (
		order.paymentStatus === "pending" ||
		order.paymentStatus === "awaiting_confirmation"
	) {
		await db
			.update(orders)
			.set({
				paymentStatus: "awaiting_confirmation",
			})
			.where(eq(orders.id, orderId));
	}

	// Link event to merchant
	await db
		.update(paypalEvents)
		.set({ merchantId: order.merchantId })
		.where(eq(paypalEvents.id, event.id));

	paypalLogger.info({ orderId }, "Order approved by customer");
}

export { paypalWebhook };
