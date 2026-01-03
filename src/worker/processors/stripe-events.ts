import { RedisClient } from "bun";
import { env } from "@/env";
import { stripeLogger } from "@/lib/logger";
import {
	getEventById,
	getRetryCount,
	incrementRetryCount,
	markEventFailed,
	markEventProcessed,
} from "@/lib/stripe/events";
import { processStripeEvent } from "@/lib/stripe/processor";

const QUEUE_NAME = "stripe:events";
const DEAD_LETTER_QUEUE = "stripe:events:dead";
const MAX_RETRIES = 3;

// Create Redis client with explicit connection
const redis = new RedisClient(env.REDIS_URL ?? "redis://localhost:6379");

/**
 * Start the Stripe event processor.
 * Continuously processes jobs from the queue.
 */
export async function startStripeProcessor(): Promise<void> {
	stripeLogger.info({ queue: QUEUE_NAME }, "Stripe event processor started");

	while (true) {
		try {
			// BRPOP blocks until a job is available (timeout 0 = wait forever)
			const result = await redis.send("BRPOP", [QUEUE_NAME, "0"]);

			if (result) {
				// BRPOP returns [queueName, value]
				const [, eventId] = result as [string, string];

				stripeLogger.debug({ eventId }, "Processing Stripe event...");

				try {
					// Fetch event from DB
					const event = await getEventById(eventId);

					if (!event) {
						stripeLogger.error(
							{ eventId },
							"Event not found in database, skipping",
						);
						continue;
					}

					// Skip if already processed
					if (event.processingStatus === "PROCESSED") {
						stripeLogger.debug(
							{ eventId },
							"Event already processed, skipping",
						);
						continue;
					}

					// Process the event
					await processStripeEvent(eventId);

					// Mark as processed
					await markEventProcessed(eventId);
					stripeLogger.info({ eventId }, "Successfully processed Stripe event");
				} catch (error) {
					stripeLogger.error(
						{ eventId, error },
						"Failed to process Stripe event",
					);

					// Get current retry count
					const retryCount = await getRetryCount(eventId);

					if (retryCount < MAX_RETRIES) {
						// Increment retry count and re-enqueue
						await incrementRetryCount(eventId);
						await redis.send("LPUSH", [QUEUE_NAME, eventId]);
						stripeLogger.warn(
							{ eventId, retryCount: retryCount + 1 },
							"Re-enqueued Stripe event for retry",
						);
					} else {
						// Move to dead letter queue and mark as failed
						await redis.send("LPUSH", [DEAD_LETTER_QUEUE, eventId]);
						await markEventFailed(eventId);
						stripeLogger.error(
							{ eventId, retryCount },
							"Max retries exceeded, moved to dead letter queue",
						);
					}
				}
			}
		} catch (error) {
			stripeLogger.error({ error }, "Stripe processor error");
			// Wait a bit before retrying to avoid spinning on errors
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}
