import type { Stripe } from "stripe";
import { stripeLogger } from "../../lib/logger";
import { getEventById, markEventProcessed } from "./events";
import { dispatchV1Event, dispatchV2Event } from "./handlers/registry";
import { isV1Event, isV2Event } from "./schemas";

// Import handlers to trigger self-registration
import "./handlers/subscription.handler";
import "./handlers/checkout.handler";
import "./handlers/account.handler";

/**
 * Process a Stripe event from the database.
 *
 * Routes events to appropriate handlers based on event type using the handler registry.
 * Handles both V1 (full payload) and V2 thin events.
 *
 * Called by the queue worker to process events asynchronously.
 *
 * @param eventId - The Stripe event ID to process
 */
export async function processStripeEvent(eventId: string): Promise<void> {
	const event = await getEventById(eventId);
	if (!event) {
		stripeLogger.warn({ eventId }, "Event not found in database");
		return;
	}

	if (event.processingStatus === "PROCESSED") {
		stripeLogger.debug({ eventId }, "Event already processed, skipping");
		return;
	}

	stripeLogger.info(
		{ eventId, eventType: event.eventType },
		"Processing event",
	);

	const eventType = event.eventType;
	const payload = event.payload as Record<string, unknown>;

	if (isV1Event(eventType)) {
		// V1 snapshot events have full payload
		const stripeEvent = payload as unknown as Stripe.Event;
		const handler = dispatchV1Event(stripeEvent);
		if (handler) {
			await handler;
		} else {
			stripeLogger.debug({ eventType }, "No handler registered for V1 event");
		}
	} else if (isV2Event(eventType)) {
		// V2 thin events need to fetch data from Stripe API
		const handler = dispatchV2Event(eventType, payload);
		if (handler) {
			await handler;
		} else {
			stripeLogger.debug({ eventType }, "No handler registered for V2 event");
		}
	} else {
		stripeLogger.debug({ eventType }, "Unhandled event type");
	}

	// Mark event as processed after successful handling
	await markEventProcessed(eventId);

	stripeLogger.info(
		{ eventId, eventType: event.eventType },
		"Event processed successfully",
	);
}
