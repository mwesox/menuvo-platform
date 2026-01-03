import { RedisClient } from "bun";
import { env } from "@/env";
import { menuImportLogger } from "@/lib/logger";

const QUEUE_NAME = "menu:import";
const DEAD_LETTER_QUEUE = "menu:import:dead";

// Create Redis client with explicit connection
const redis = new RedisClient(env.REDIS_URL ?? "redis://localhost:6379");

/**
 * Move a failed job to the dead letter queue.
 */
async function moveToDeadLetter(jobId: number): Promise<void> {
	await redis.send("LPUSH", [DEAD_LETTER_QUEUE, String(jobId)]);
	menuImportLogger.warn(
		{ jobId },
		"Moved menu import job to dead letter queue",
	);
}

/**
 * Start the menu import processor.
 * Continuously processes jobs from the queue.
 *
 * Note: Uses dynamic import for processor to avoid bundling database code
 * into client bundles when queue functions are imported from API routes.
 */
export async function startImportProcessor(): Promise<void> {
	// Dynamic import to avoid pulling db code into client bundle
	const { processMenuImportJob } = await import(
		"@/features/console/menu-import/server/processor"
	);

	menuImportLogger.info({ queue: QUEUE_NAME }, "Menu import processor started");

	while (true) {
		try {
			// BRPOP blocks until a job is available (timeout 0 = wait forever)
			const result = await redis.send("BRPOP", [QUEUE_NAME, "0"]);

			if (result) {
				// BRPOP returns [queueName, value]
				const [, jobIdStr] = result as [string, string];
				const jobId = Number(jobIdStr);

				menuImportLogger.debug({ jobId }, "Processing menu import job...");

				try {
					await processMenuImportJob(jobId);
					menuImportLogger.info(
						{ jobId },
						"Successfully processed menu import job",
					);
				} catch (error) {
					menuImportLogger.error(
						{ jobId, error },
						"Failed to process menu import job",
					);
					// Move to dead letter queue for manual inspection
					await moveToDeadLetter(jobId);
				}
			}
		} catch (error) {
			menuImportLogger.error({ error }, "Menu import processor error");
			// Wait a bit before retrying to avoid spinning on errors
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}
