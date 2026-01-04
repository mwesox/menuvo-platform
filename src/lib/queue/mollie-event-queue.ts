/**
 * Mollie Event Queue Utilities
 *
 * Enqueue functions for Mollie event processing.
 * The actual processor runs in src/worker/processors/mollie-events.ts
 */
import { RedisClient } from "bun";
import { env } from "@/env";
import { mollieLogger } from "@/lib/logger";

const QUEUE_NAME = "mollie:events";

// Create Redis client with explicit connection
const redis = new RedisClient(env.REDIS_URL ?? "redis://localhost:6379");

/**
 * Enqueue a Mollie event for processing.
 * Called by webhook routes after event ingestion.
 */
export async function enqueueMollieEvent(eventId: string): Promise<void> {
	await redis.send("LPUSH", [QUEUE_NAME, eventId]);
	mollieLogger.debug({ eventId }, "Enqueued Mollie event for processing");
}

/**
 * Get the current queue length.
 */
export async function getQueueLength(): Promise<number> {
	const result = await redis.send("LLEN", [QUEUE_NAME]);
	return result as number;
}
