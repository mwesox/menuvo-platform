import { mollieLogger } from "@/lib/logger";
import {
	getEventById,
	incrementRetryCount,
	markEventFailed,
	markEventProcessed,
} from "./events";
// Import from handlers/index to trigger self-registration of all handlers
import { dispatchMollieEvent, type MollieEventType } from "./handlers";

/**
 * Maximum number of retry attempts before marking event as failed.
 */
const MAX_RETRIES = 3;

/**
 * Process a Mollie event from the database.
 *
 * Routes events to appropriate handlers based on event type using the handler registry.
 * Unlike Stripe, Mollie only has one event format (thin webhooks with resource ID).
 *
 * Called by the queue worker to process events asynchronously.
 *
 * @param eventId - The Mollie event ID to process
 */
export async function processMollieEvent(eventId: string): Promise<void> {
	const event = await getEventById(eventId);
	if (!event) {
		mollieLogger.warn({ eventId }, "Event not found in database");
		return;
	}

	if (event.processingStatus === "PROCESSED") {
		mollieLogger.debug({ eventId }, "Event already processed, skipping");
		return;
	}

	const eventType = event.eventType as MollieEventType;
	const resourceId = event.resourceId;
	const payload = event.payload as Record<string, unknown>;

	mollieLogger.info(
		{ eventId, eventType, resourceId },
		"Processing Mollie event",
	);

	try {
		const handler = dispatchMollieEvent(eventType, resourceId, payload);

		if (handler) {
			await handler;
			mollieLogger.info(
				{ eventId, eventType, resourceId },
				"Event processed successfully",
			);
		} else {
			// No handler registered - log warning but mark as processed to avoid reprocessing
			mollieLogger.warn(
				{ eventId, eventType },
				"No handler registered for event type, marking as processed",
			);
		}

		await markEventProcessed(eventId);
	} catch (error) {
		mollieLogger.error(
			{ eventId, eventType, resourceId, error },
			"Error processing Mollie event",
		);

		// Increment retry count
		await incrementRetryCount(eventId);

		// Check if we've exceeded max retries
		const updatedEvent = await getEventById(eventId);
		if (updatedEvent && updatedEvent.retryCount >= MAX_RETRIES) {
			mollieLogger.error(
				{ eventId, eventType, retryCount: updatedEvent.retryCount },
				"Max retries exceeded, marking event as failed",
			);
			await markEventFailed(eventId);
		}

		// Re-throw to signal failure to queue worker
		throw error;
	}
}
