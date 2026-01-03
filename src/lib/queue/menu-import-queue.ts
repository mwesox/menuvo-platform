/**
 * Menu Import Queue Utilities
 *
 * Enqueue functions for menu import processing.
 * The actual processor runs in src/worker/processors/imports.ts
 */
import { RedisClient } from "bun";
import { env } from "@/env";
import { menuImportLogger } from "@/lib/logger";

const QUEUE_NAME = "menu:import";

// Create Redis client with explicit connection
const redis = new RedisClient(env.REDIS_URL ?? "redis://localhost:6379");

/**
 * Enqueue a menu import job for processing.
 * Called after file upload and job record creation.
 */
export async function enqueueImportJob(jobId: number): Promise<void> {
	await redis.send("LPUSH", [QUEUE_NAME, String(jobId)]);
	menuImportLogger.debug({ jobId }, "Enqueued menu import job for processing");
}

/**
 * Get the current queue length.
 */
export async function getQueueLength(): Promise<number> {
	const result = await redis.send("LLEN", [QUEUE_NAME]);
	return result as number;
}
