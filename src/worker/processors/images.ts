import { RedisClient } from "bun";
import { env } from "@/env";
import { imageLogger } from "@/lib/logger";
import { processImageVariants } from "@/lib/storage/image-processor";

const QUEUE_NAME = "image:variants";
const DEAD_LETTER_QUEUE = "image:variants:dead";

// Create Redis client with explicit connection
const redis = new RedisClient(env.REDIS_URL ?? "redis://localhost:6379");

/**
 * Start the image variant processor.
 * Continuously processes jobs from the queue.
 */
export async function startImageProcessor(): Promise<void> {
	imageLogger.info({ queue: QUEUE_NAME }, "Image variant processor started");

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
			imageLogger.error({ error }, "Processor error");
			// Wait a bit before retrying to avoid spinning on errors
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}
