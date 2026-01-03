/**
 * Stripe Event Queue Utilities
 *
 * Enqueue functions for Stripe event processing.
 * The actual processor runs in src/worker/processors/stripe-events.ts
 */
import { RedisClient } from "bun";
import { env } from "@/env";
import { stripeLogger } from "@/lib/logger";

const QUEUE_NAME = "stripe:events";

// Create Redis client with explicit connection
const redis = new RedisClient(env.REDIS_URL ?? "redis://localhost:6379");

/**
 * Enqueue a Stripe event for processing.
 * Called by webhook routes after event ingestion.
 */
export async function enqueueStripeEvent(eventId: string): Promise<void> {
	await redis.send("LPUSH", [QUEUE_NAME, eventId]);
	stripeLogger.debug({ eventId }, "Enqueued Stripe event for processing");
}

/**
 * Get the current queue length.
 */
export async function getQueueLength(): Promise<number> {
	const result = await redis.send("LLEN", [QUEUE_NAME]);
	return result as number;
}
