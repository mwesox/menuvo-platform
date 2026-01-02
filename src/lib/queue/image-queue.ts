import { RedisClient } from "bun";
import { env } from "@/env";
import { imageLogger } from "@/lib/logger";
import { processImageVariants } from "@/lib/storage/image-processor";

const QUEUE_NAME = "image:variants";
const DEAD_LETTER_QUEUE = "image:variants:dead";

// Create Redis client with explicit connection
const redis = new RedisClient(env.REDIS_URL ?? "redis://localhost:6379");

/**
 * Enqueue an image for variant generation.
 * Called after successful upload to S3.
 */
export async function enqueueVariantJob(imageId: number): Promise<void> {
	await redis.send("LPUSH", [QUEUE_NAME, String(imageId)]);
	imageLogger.debug({ imageId }, "Enqueued image for variant processing");
}

/**
 * Get the current queue length.
 */
export async function getQueueLength(): Promise<number> {
	const result = await redis.send("LLEN", [QUEUE_NAME]);
	return result as number;
}

/**
 * Process a single job from the queue (non-blocking).
 * Returns true if a job was processed, false if queue is empty.
 */
export async function processOneJob(): Promise<boolean> {
	// RPOP returns null if queue is empty
	const result = await redis.send("RPOP", [QUEUE_NAME]);
	if (!result) return false;

	const imageId = Number(result as string);

	try {
		await processImageVariants(imageId);
		return true;
	} catch (error) {
		imageLogger.error({ imageId, error }, "Failed to process image");
		// Move to dead letter queue for manual inspection
		await redis.send("LPUSH", [DEAD_LETTER_QUEUE, String(imageId)]);
		return true;
	}
}

/**
 * Start the worker loop (blocking).
 * This should be run as a separate process.
 */
export async function startWorker(): Promise<void> {
	imageLogger.info({ queue: QUEUE_NAME }, "Image variant worker started");

	while (true) {
		try {
			// BRPOP blocks until a job is available (timeout 0 = wait forever)
			const result = await redis.send("BRPOP", [QUEUE_NAME, "0"]);

			if (result) {
				// BRPOP returns [queueName, value]
				const [, imageIdStr] = result as [string, string];
				const imageId = Number(imageIdStr);

				imageLogger.debug({ imageId }, "Processing image...");

				try {
					await processImageVariants(imageId);
					imageLogger.info({ imageId }, "Successfully processed image");
				} catch (error) {
					imageLogger.error({ imageId, error }, "Failed to process image");
					// Move to dead letter queue for manual inspection
					await redis.send("LPUSH", [DEAD_LETTER_QUEUE, String(imageId)]);
					imageLogger.warn({ imageId }, "Moved image to dead letter queue");
				}
			}
		} catch (error) {
			imageLogger.error({ error }, "Worker error");
			// Wait a bit before retrying to avoid spinning on errors
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}
