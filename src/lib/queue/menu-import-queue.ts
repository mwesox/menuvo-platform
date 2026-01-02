import { RedisClient } from "bun";
import { env } from "@/env";

const QUEUE_NAME = "menu:import";
const DEAD_LETTER_QUEUE = "menu:import:dead";

// Create Redis client with explicit connection
const redis = new RedisClient(env.REDIS_URL ?? "redis://localhost:6379");

/**
 * Enqueue a menu import job for processing.
 * Called after file upload and job record creation.
 */
export async function enqueueImportJob(jobId: number): Promise<void> {
	await redis.send("LPUSH", [QUEUE_NAME, String(jobId)]);
	console.log(`Enqueued menu import job ${jobId} for processing`);
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
 * Returns the job ID if a job was found, null if queue is empty.
 */
export async function popJob(): Promise<number | null> {
	const result = await redis.send("RPOP", [QUEUE_NAME]);
	if (!result) return null;
	return Number(result as string);
}

/**
 * Move a failed job to the dead letter queue.
 */
export async function moveToDeadLetter(jobId: number): Promise<void> {
	await redis.send("LPUSH", [DEAD_LETTER_QUEUE, String(jobId)]);
	console.log(`Moved menu import job ${jobId} to dead letter queue`);
}

/**
 * Get the dead letter queue length.
 */
export async function getDeadLetterQueueLength(): Promise<number> {
	const result = await redis.send("LLEN", [DEAD_LETTER_QUEUE]);
	return result as number;
}

/**
 * Start the menu import worker.
 * Continuously processes jobs from the queue.
 *
 * Note: Uses dynamic import for processor to avoid bundling database code
 * into client bundles when queue functions are imported from API routes.
 */
export async function startMenuImportWorker(): Promise<void> {
	// Dynamic import to avoid pulling db code into client bundle
	const { processMenuImportJob } = await import(
		"@/features/console/menu-import/server/processor"
	);

	console.log("Menu import worker started");
	console.log(`Listening on queue: ${QUEUE_NAME}`);

	while (true) {
		try {
			// BRPOP blocks until a job is available (timeout 0 = wait forever)
			const result = await redis.send("BRPOP", [QUEUE_NAME, "0"]);

			if (result) {
				// BRPOP returns [queueName, value]
				const [, jobIdStr] = result as [string, string];
				const jobId = Number(jobIdStr);

				console.log(`Processing menu import job ${jobId}...`);

				try {
					await processMenuImportJob(jobId);
					console.log(`Successfully processed menu import job ${jobId}`);
				} catch (error) {
					console.error(`Failed to process menu import job ${jobId}:`, error);
					// Move to dead letter queue for manual inspection
					await moveToDeadLetter(jobId);
				}
			}
		} catch (error) {
			console.error("Menu import worker error:", error);
			// Wait a bit before retrying to avoid spinning on errors
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}
