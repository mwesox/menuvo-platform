import type Stripe from "stripe";
import { env } from "@/env";
import { webhookLogger } from "@/lib/logger";
import { enqueueStripeEvent } from "@/lib/queue/stripe-event-queue";
import {
	getStripeClient,
	ingestStripeEvent,
	ThinEventPayloadSchema,
} from "@/lib/stripe";

/**
 * Handle V1 Stripe snapshot webhook events.
 *
 * V1 events include full payload (checkout sessions, subscriptions, etc.).
 * The event is stored in DB and enqueued for async processing.
 */
export async function handleStripeV1(req: Request): Promise<Response> {
	// Validate environment
	if (!env.STRIPE_WEBHOOK_SECRET) {
		webhookLogger.error("STRIPE_WEBHOOK_SECRET not configured");
		return Response.json({ error: "Webhook not configured" }, { status: 500 });
	}

	const stripe = getStripeClient();
	const signature = req.headers.get("stripe-signature");

	if (!signature) {
		webhookLogger.warn("Missing stripe-signature header");
		return Response.json(
			{ error: "Missing stripe-signature header" },
			{ status: 400 },
		);
	}

	// Get raw body for signature verification
	const rawBody = await req.text();

	// Verify signature and construct event
	// Note: Must use async version for Bun (Web Crypto API is async)
	let event: Stripe.Event;
	try {
		event = await stripe.webhooks.constructEventAsync(
			rawBody,
			signature,
			env.STRIPE_WEBHOOK_SECRET,
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		webhookLogger.error(
			{
				error: message,
				secretPrefix: `${env.STRIPE_WEBHOOK_SECRET.substring(0, 12)}...`,
				signaturePrefix: `${signature.substring(0, 30)}...`,
				bodyLength: rawBody.length,
			},
			"Webhook signature verification failed",
		);
		return Response.json({ error: "Invalid signature" }, { status: 400 });
	}

	webhookLogger.info(
		{ eventId: event.id, eventType: event.type, account: event.account },
		"Webhook received",
	);

	// Store event in database (idempotency via ON CONFLICT DO NOTHING)
	const ingestResult = await ingestStripeEvent({
		eventId: event.id,
		eventType: event.type,
		apiVersion: event.api_version ?? null,
		stripeCreatedAt: new Date(event.created * 1000),
		stripeAccountId: event.account ?? null,
		payload: event as unknown as Record<string, unknown>,
	});

	// If event already exists (duplicate webhook), skip enqueue
	if (!ingestResult.isNew) {
		webhookLogger.debug(
			{ eventId: event.id },
			"Event already exists (duplicate webhook)",
		);
		return Response.json({ received: true, duplicate: true });
	}

	// Enqueue for async processing
	await enqueueStripeEvent(event.id);

	webhookLogger.info(
		{ eventId: event.id, eventType: event.type },
		"Event stored and enqueued",
	);

	return Response.json({ received: true });
}

/**
 * Handle V2 Stripe thin webhook events.
 *
 * V2 thin events contain minimal payload (just event ID and related object).
 * Full data is fetched from Stripe API during processing.
 *
 * Supported events:
 * - v2.core.account[requirements].updated
 * - v2.core.account[configuration.merchant].capability_status_updated
 */
export async function handleStripeV2(req: Request): Promise<Response> {
	// Validate environment
	if (!env.STRIPE_WEBHOOK_SECRET_THIN) {
		webhookLogger.error("STRIPE_WEBHOOK_SECRET_THIN not configured");
		return Response.json({ error: "Webhook not configured" }, { status: 500 });
	}

	const stripe = getStripeClient();
	const signature = req.headers.get("stripe-signature");

	if (!signature) {
		return Response.json(
			{ error: "Missing stripe-signature header" },
			{ status: 400 },
		);
	}

	// Get raw body for signature verification
	const rawBody = await req.text();

	// Verify signature
	// Note: Must use async version for Bun (Web Crypto API is async)
	try {
		await stripe.webhooks.signature.verifyHeaderAsync(
			rawBody,
			signature,
			env.STRIPE_WEBHOOK_SECRET_THIN,
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		webhookLogger.error(
			{
				error: message,
				secretPrefix: `${env.STRIPE_WEBHOOK_SECRET_THIN.substring(0, 12)}...`,
				signaturePrefix: `${signature.substring(0, 30)}...`,
				bodyLength: rawBody.length,
			},
			"Webhook signature verification failed",
		);
		return Response.json({ error: "Invalid signature" }, { status: 400 });
	}

	// Parse and validate thin event payload with Zod
	let rawPayload: unknown;
	try {
		rawPayload = JSON.parse(rawBody);
	} catch {
		return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
	}

	const parseResult = ThinEventPayloadSchema.safeParse(rawPayload);
	if (!parseResult.success) {
		webhookLogger.error(
			{ errors: parseResult.error.issues },
			"Invalid thin event payload",
		);
		return Response.json({ error: "Invalid payload format" }, { status: 400 });
	}

	const thinEvent = parseResult.data;

	webhookLogger.info(
		{ eventId: thinEvent.id, eventType: thinEvent.type },
		"Thin event received",
	);

	// Store event in database (idempotency via ON CONFLICT DO NOTHING)
	const ingestResult = await ingestStripeEvent({
		eventId: thinEvent.id,
		eventType: thinEvent.type,
		apiVersion: null, // V2 thin events don't include API version
		stripeCreatedAt: new Date(thinEvent.created),
		stripeAccountId: thinEvent.related_object?.id ?? null,
		payload: rawPayload as Record<string, unknown>,
	});

	// If event already exists (duplicate webhook), skip enqueue
	if (!ingestResult.isNew) {
		webhookLogger.debug(
			{ eventId: thinEvent.id },
			"Event already exists (duplicate webhook)",
		);
		return Response.json({ received: true, duplicate: true });
	}

	// Enqueue for async processing
	await enqueueStripeEvent(thinEvent.id);

	webhookLogger.info(
		{ eventId: thinEvent.id, eventType: thinEvent.type },
		"Event stored and enqueued",
	);

	return Response.json({ received: true });
}
