/**
 * Image Queue Utilities
 *
 * Enqueue functions for image variant processing.
 * The actual processor runs in src/worker/processors/images.ts
 */
import { RedisClient } from "bun";
import { env } from "@/env";
import { imageLogger } from "@/lib/logger";

const QUEUE_NAME = "image:variants";

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
