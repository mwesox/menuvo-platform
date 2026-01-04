import type { Payment } from "@mollie/api-client";
import { webhookLogger } from "@/lib/logger";
import { getMollieClient } from "@/lib/mollie/client";
import { ingestMollieEvent } from "@/lib/mollie/events";
import { enqueueMollieEvent } from "@/lib/queue/mollie-event-queue";

/**
 * Mollie resource type prefixes.
 * Used to determine the type of resource from its ID.
 */
const RESOURCE_PREFIXES = {
	tr_: "payment",
	sub_: "subscription",
	re_: "refund",
	mdt_: "mandate",
} as const;

type ResourceType = (typeof RESOURCE_PREFIXES)[keyof typeof RESOURCE_PREFIXES];

/**
 * Determine the resource type from a Mollie resource ID.
 */
function getResourceType(resourceId: string): ResourceType | null {
	for (const [prefix, type] of Object.entries(RESOURCE_PREFIXES)) {
		if (resourceId.startsWith(prefix)) {
			return type as ResourceType;
		}
	}
	return null;
}

/**
 * Determine the event type for a payment based on its status.
 */
function getPaymentEventType(payment: Payment): string {
	switch (payment.status) {
		case "paid":
			return "payment.paid";
		case "failed":
			return "payment.failed";
		case "expired":
			return "payment.expired";
		case "canceled":
			return "payment.canceled";
		case "pending":
			return "payment.pending";
		case "open":
			return "payment.open";
		case "authorized":
			return "payment.authorized";
		default:
			return `payment.${payment.status}`;
	}
}

/**
 * Extract merchant context from payment metadata.
 * Our payments include orderId and storeId in metadata which we can use
 * to find the associated merchant.
 *
 * Returns null if metadata doesn't contain expected fields.
 */
function extractMerchantFromPayment(payment: Payment): number | null {
	const metadata = payment.metadata as Record<string, unknown> | null;
	if (!metadata) {
		return null;
	}

	// Try to get merchantId directly if present
	if (typeof metadata.merchantId === "number") {
		return metadata.merchantId;
	}

	// merchantId might be stored as string
	if (typeof metadata.merchantId === "string") {
		const parsed = Number.parseInt(metadata.merchantId, 10);
		if (!Number.isNaN(parsed)) {
			return parsed;
		}
	}

	// Note: If merchantId is not in metadata, we'll need to look it up
	// from the order/store during processing. Return null for now.
	return null;
}

/**
 * Handle Mollie webhook events.
 *
 * Mollie webhooks are simple - they POST form data with just an `id` field
 * containing the resource ID. We need to:
 * 1. Parse the form data to get the resource ID
 * 2. Determine the resource type from the ID prefix
 * 3. Fetch the full resource from Mollie API
 * 4. Ingest and enqueue for processing
 *
 * Currently supports:
 * - Payments (tr_*) - Primary use case for order payments
 *
 * Other resource types (subscriptions, refunds, mandates) log a warning
 * and return 200 to acknowledge receipt.
 */
export async function handleMollieWebhook(req: Request): Promise<Response> {
	// Parse form data to get the resource ID
	let formData: FormData;
	try {
		formData = await req.formData();
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		webhookLogger.error(
			{ error: message },
			"Failed to parse Mollie webhook form data",
		);
		return Response.json({ error: "Invalid form data" }, { status: 400 });
	}

	const resourceId = formData.get("id");
	if (!resourceId || typeof resourceId !== "string") {
		webhookLogger.warn("Mollie webhook missing 'id' field");
		return Response.json({ error: "Missing 'id' field" }, { status: 400 });
	}

	// Determine resource type from ID prefix
	const resourceType = getResourceType(resourceId);
	if (!resourceType) {
		webhookLogger.warn(
			{ resourceId },
			"Unknown Mollie resource type (unrecognized ID prefix)",
		);
		// Return 200 to acknowledge receipt - Mollie will retry on non-2xx
		return Response.json({ received: true, skipped: true });
	}

	webhookLogger.info({ resourceId, resourceType }, "Mollie webhook received");

	// Handle based on resource type
	switch (resourceType) {
		case "payment":
			return handlePaymentWebhook(resourceId);

		case "refund":
			return handleRefundWebhook(resourceId);

		case "subscription":
			return handleSubscriptionWebhook(resourceId);

		case "mandate":
			// Mandates are handled via payment webhooks (first payment creates mandate)
			webhookLogger.debug(
				{ resourceId, resourceType },
				"Mandate webhook acknowledged - handled via payment flow",
			);
			return Response.json({ received: true, skipped: true });

		default:
			// Unknown resource type - acknowledge but don't process
			return Response.json({ received: true, skipped: true });
	}
}

/**
 * Handle a payment webhook from Mollie.
 *
 * Fetches the payment from Mollie API, determines the event type
 * based on payment status, and ingests/enqueues for processing.
 */
async function handlePaymentWebhook(paymentId: string): Promise<Response> {
	const mollie = getMollieClient();

	// Fetch payment from Mollie API
	let payment: Payment;
	try {
		payment = await mollie.payments.get(paymentId);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		webhookLogger.error(
			{ paymentId, error: message },
			"Failed to fetch payment from Mollie API",
		);
		// Return 500 so Mollie will retry
		return Response.json({ error: "Failed to fetch payment" }, { status: 500 });
	}

	const eventType = getPaymentEventType(payment);
	const merchantId = extractMerchantFromPayment(payment);

	webhookLogger.info(
		{
			paymentId,
			eventType,
			status: payment.status,
			merchantId,
			orderId: (payment.metadata as Record<string, unknown> | null)?.orderId,
		},
		"Processing Mollie payment webhook",
	);

	// Ingest event into database
	const ingestResult = await ingestMollieEvent({
		eventType,
		resourceId: paymentId,
		resourceType: "payment",
		merchantId,
		payload: payment as unknown as Record<string, unknown>,
	});

	// If event was a duplicate (already exists), acknowledge but skip enqueue
	if (!ingestResult.isNew) {
		webhookLogger.debug(
			{ paymentId, eventId: ingestResult.eventId },
			"Payment event already exists (duplicate webhook)",
		);
		return Response.json({ received: true, duplicate: true });
	}

	// Enqueue for async processing
	await enqueueMollieEvent(ingestResult.eventId);

	webhookLogger.info(
		{ paymentId, eventId: ingestResult.eventId, eventType },
		"Mollie payment event stored and enqueued",
	);

	return Response.json({ received: true });
}

/**
 * Handle a refund webhook from Mollie.
 *
 * Fetches the refund from Mollie API, determines the event type
 * based on refund status, and ingests/enqueues for processing.
 */
async function handleRefundWebhook(refundId: string): Promise<Response> {
	try {
		webhookLogger.info({ refundId }, "Refund webhook received - processing");

		// Ingest event with minimal info - handler will fetch full details
		const ingestResult = await ingestMollieEvent({
			eventType: "refund.updated",
			resourceId: refundId,
			resourceType: "refund",
			merchantId: null,
			payload: { id: refundId },
		});

		if (!ingestResult.isNew) {
			webhookLogger.debug(
				{ refundId, eventId: ingestResult.eventId },
				"Refund event already exists (duplicate webhook)",
			);
			return Response.json({ received: true, duplicate: true });
		}

		await enqueueMollieEvent(ingestResult.eventId);

		webhookLogger.info(
			{ refundId, eventId: ingestResult.eventId },
			"Mollie refund event stored and enqueued",
		);

		return Response.json({ received: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		webhookLogger.error(
			{ refundId, error: message },
			"Failed to process refund webhook",
		);
		return Response.json(
			{ error: "Failed to process refund" },
			{ status: 500 },
		);
	}
}

/**
 * Handle a subscription webhook from Mollie.
 *
 * Fetches the subscription from Mollie API and ingests/enqueues for processing.
 */
async function handleSubscriptionWebhook(
	subscriptionId: string,
): Promise<Response> {
	webhookLogger.info({ subscriptionId }, "Subscription webhook received");

	try {
		// Ingest event - handler will fetch full subscription details using customer ID from DB
		const ingestResult = await ingestMollieEvent({
			eventType: "subscription.updated",
			resourceId: subscriptionId,
			resourceType: "subscription",
			merchantId: null,
			payload: { id: subscriptionId },
		});

		if (!ingestResult.isNew) {
			webhookLogger.debug(
				{ subscriptionId, eventId: ingestResult.eventId },
				"Subscription event already exists (duplicate webhook)",
			);
			return Response.json({ received: true, duplicate: true });
		}

		await enqueueMollieEvent(ingestResult.eventId);

		webhookLogger.info(
			{ subscriptionId, eventId: ingestResult.eventId },
			"Mollie subscription event stored and enqueued",
		);

		return Response.json({ received: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		webhookLogger.error(
			{ subscriptionId, error: message },
			"Failed to process subscription webhook",
		);
		return Response.json(
			{ error: "Failed to process subscription" },
			{ status: 500 },
		);
	}
}
