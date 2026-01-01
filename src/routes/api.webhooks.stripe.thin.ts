import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/env";
import {
	getStripeClient,
	ingestStripeEvent,
	mapCapabilityStatus,
	mapRequirementsStatus,
	markEventFailed,
	markEventProcessed,
	updateMerchantPaymentStatus,
} from "@/lib/stripe";

/**
 * Thin event payload structure for V2 events.
 */
type ThinEventPayload = {
	id: string;
	type: string;
	created: string;
	related_object?: {
		id: string;
		type: string;
		url: string;
	};
};

/**
 * Stripe Thin Events Webhook Handler
 *
 * Handles thin events (lightweight payload) from Stripe V2 API resources:
 * - v2.core.account[requirements].updated - Account requirements changed
 * - v2.core.account[configuration.merchant].capability_status_updated - Capability changed
 *
 * ALL events are stored in the database without filtering.
 *
 * Setup:
 * 1. In Stripe Dashboard → Developers → Webhooks → Add destination
 * 2. Select "Connected accounts" in "Events from" section
 * 3. Select "Show advanced options" → Payload style: "Thin"
 * 4. Add event types:
 *    - v2.core.account[requirements].updated
 *    - v2.core.account[configuration.merchant].capability_status_updated
 *
 * Local testing with Stripe CLI:
 * stripe listen --thin-events \
 *   'v2.core.account[requirements].updated,v2.core.account[configuration.merchant].capability_status_updated' \
 *   --forward-thin-to http://localhost:3000/api/webhooks/stripe/thin
 */
export const Route = createFileRoute("/api/webhooks/stripe/thin")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				// Validate environment
				if (!env.STRIPE_WEBHOOK_SECRET_THIN) {
					console.error("STRIPE_WEBHOOK_SECRET_THIN not configured");
					return Response.json(
						{ error: "Webhook not configured" },
						{ status: 500 },
					);
				}

				const stripe = getStripeClient();
				const signature = request.headers.get("stripe-signature");

				if (!signature) {
					return Response.json(
						{ error: "Missing stripe-signature header" },
						{ status: 400 },
					);
				}

				// Get raw body for signature verification
				const rawBody = await request.text();

				// Verify signature
				try {
					stripe.webhooks.signature.verifyHeader(
						rawBody,
						signature,
						env.STRIPE_WEBHOOK_SECRET_THIN,
					);
				} catch (err) {
					const message = err instanceof Error ? err.message : "Unknown error";
					console.error("Webhook signature verification failed:", message);
					return Response.json({ error: "Invalid signature" }, { status: 400 });
				}

				// Parse thin event payload
				let thinEvent: ThinEventPayload;
				try {
					thinEvent = JSON.parse(rawBody) as ThinEventPayload;
				} catch {
					return Response.json(
						{ error: "Invalid JSON payload" },
						{ status: 400 },
					);
				}

				console.log(`Received thin event: ${thinEvent.id} (${thinEvent.type})`);

				// Ingest event to database (idempotency check)
				// ALL events are stored without filtering
				const ingestResult = await ingestStripeEvent({
					eventId: thinEvent.id,
					eventType: thinEvent.type,
					apiVersion: null, // V2 thin events don't include API version
					stripeCreatedAt: new Date(thinEvent.created),
					stripeAccountId: thinEvent.related_object?.id ?? null,
					payload: JSON.parse(rawBody) as Record<string, unknown>,
				});

				// If event already processed, return early
				if (!ingestResult.isNew) {
					console.log(`Event already processed: ${thinEvent.id}`);
					return Response.json({ received: true, duplicate: true });
				}

				try {
					// Handle event based on type
					switch (thinEvent.type) {
						case "v2.core.account[requirements].updated":
							await handleRequirementsUpdated(stripe, thinEvent);
							break;

						case "v2.core.account[configuration.merchant].capability_status_updated":
							await handleCapabilityStatusUpdated(stripe, thinEvent);
							break;

						default:
							console.log(`Unhandled thin event type: ${thinEvent.type}`);
					}

					// Mark event as processed
					await markEventProcessed(thinEvent.id);
					return Response.json({ received: true });
				} catch (err) {
					const message = err instanceof Error ? err.message : "Unknown error";
					console.error(`Error processing event ${thinEvent.id}:`, message);

					// Mark event as failed
					await markEventFailed(thinEvent.id);

					// Return 200 to prevent Stripe retries for processing errors
					return Response.json({ received: true, error: message });
				}
			},
		},
	},
});

/**
 * Handle v2.core.account[requirements].updated event
 *
 * Triggered when account requirements change.
 */
async function handleRequirementsUpdated(
	stripe: ReturnType<typeof getStripeClient>,
	thinEvent: ThinEventPayload,
): Promise<void> {
	const accountId = thinEvent.related_object?.id;
	if (!accountId) {
		console.error("No related object in requirements.updated event");
		return;
	}

	console.log(`Requirements updated for account: ${accountId}`);

	// Fetch current account status from Stripe
	const account = await stripe.v2.core.accounts.retrieve(accountId, {
		include: ["requirements"],
	});

	// Map Stripe requirements status to our enum
	const stripeStatus = account.requirements?.summary?.minimum_deadline?.status;
	const requirementsStatus = mapRequirementsStatus(stripeStatus);

	// Check if onboarding is complete (no requirements due)
	const onboardingComplete = requirementsStatus === "none";

	console.log(
		`  Requirements status: ${requirementsStatus}, onboarding complete: ${onboardingComplete}`,
	);

	// Update merchant record
	await updateMerchantPaymentStatus({
		paymentAccountId: accountId,
		onboardingComplete,
		requirementsStatus,
	});
}

/**
 * Handle v2.core.account[configuration.merchant].capability_status_updated event
 *
 * Triggered when a capability status changes.
 */
async function handleCapabilityStatusUpdated(
	stripe: ReturnType<typeof getStripeClient>,
	thinEvent: ThinEventPayload,
): Promise<void> {
	const accountId = thinEvent.related_object?.id;
	if (!accountId) {
		console.error("No related object in capability_status_updated event");
		return;
	}

	console.log(`Capability status updated for account: ${accountId}`);

	// Fetch current account status from Stripe
	const account = await stripe.v2.core.accounts.retrieve(accountId, {
		include: ["configuration.merchant"],
	});

	// Map Stripe capability status to our enum
	const stripeStatus =
		account.configuration?.merchant?.capabilities?.card_payments?.status;
	const capabilitiesStatus = mapCapabilityStatus(stripeStatus);

	console.log(`  Card payments status: ${capabilitiesStatus}`);

	// Update merchant record
	await updateMerchantPaymentStatus({
		paymentAccountId: accountId,
		capabilitiesStatus,
	});
}
