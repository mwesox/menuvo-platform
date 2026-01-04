import { RedisClient } from "bun";
import { env } from "@/env";
import { mollieLogger } from "@/lib/logger";
import {
	getEventById,
	getRetryCount,
	incrementRetryCount,
	markEventFailed,
	markEventProcessed,
} from "@/lib/mollie/events";
import { processMollieEvent } from "@/lib/mollie/processor";

const QUEUE_NAME = "mollie:events";
const DEAD_LETTER_QUEUE = "mollie:events:dead";
const MAX_RETRIES = 3;

// Create Redis client with explicit connection
const redis = new RedisClient(env.REDIS_URL ?? "redis://localhost:6379");

/**
 * Start the Mollie event processor.
 * Continuously processes jobs from the queue.
 */
export async function startMollieProcessor(): Promise<void> {
	mollieLogger.info({ queue: QUEUE_NAME }, "Mollie event processor started");

	while (true) {
		try {
			// BRPOP blocks until a job is available (timeout 0 = wait forever)
			const result = await redis.send("BRPOP", [QUEUE_NAME, "0"]);

			if (result) {
				// BRPOP returns [queueName, value]
				const [, eventId] = result as [string, string];

				mollieLogger.debug({ eventId }, "Processing Mollie event...");

				try {
					// Fetch event from DB
					const event = await getEventById(eventId);

					if (!event) {
						mollieLogger.error(
							{ eventId },
							"Event not found in database, skipping",
						);
						continue;
					}

					// Skip if already processed
					if (event.processingStatus === "PROCESSED") {
						mollieLogger.debug(
							{ eventId },
							"Event already processed, skipping",
						);
						continue;
					}

					// Process the event
					await processMollieEvent(eventId);

					// Mark as processed
					await markEventProcessed(eventId);
					mollieLogger.info({ eventId }, "Successfully processed Mollie event");
				} catch (error) {
					mollieLogger.error(
						{ eventId, error },
						"Failed to process Mollie event",
					);

					// Get current retry count
					const retryCount = await getRetryCount(eventId);

					if (retryCount < MAX_RETRIES) {
						// Increment retry count and re-enqueue
						await incrementRetryCount(eventId);
						await redis.send("LPUSH", [QUEUE_NAME, eventId]);
						mollieLogger.warn(
							{ eventId, retryCount: retryCount + 1 },
							"Re-enqueued Mollie event for retry",
						);
					} else {
						// Move to dead letter queue and mark as failed
						await redis.send("LPUSH", [DEAD_LETTER_QUEUE, eventId]);
						await markEventFailed(eventId);
						mollieLogger.error(
							{ eventId, retryCount },
							"Max retries exceeded, moved to dead letter queue",
						);
					}
				}
			}
		} catch (error) {
			mollieLogger.error({ error }, "Mollie processor error");
			// Wait a bit before retrying to avoid spinning on errors
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}
