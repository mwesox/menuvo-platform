/**
 * Background workers entry point.
 * Run as a separate process with optional worker type selection.
 *
 * Usage:
 *   bun run worker                    # Run all workers (default)
 *   bun run worker --type images      # Run only image processing worker
 *   bun run worker --type imports     # Run only menu import worker
 *   bun run worker --type all         # Run all workers
 */
import { parseArgs } from "node:util";
import { queueLogger } from "@/lib/logger";
import { startWorker as startImageWorker } from "./image-queue";
import { startMenuImportWorker } from "./menu-import-queue";

// Parse CLI arguments using Bun-recommended util.parseArgs
const { values } = parseArgs({
	args: Bun.argv,
	options: {
		type: {
			type: "string",
			default: "all",
		},
	},
	strict: false,
	allowPositionals: true,
});

const workerType = values.type as string;

if (!["images", "imports", "all"].includes(workerType)) {
	queueLogger.error(
		{ workerType },
		"Invalid worker type. Use: images, imports, or all",
	);
	process.exit(1);
}

queueLogger.info({ workerType }, "Starting background worker(s)...");

// Handle graceful shutdown
process.on("SIGINT", () => {
	queueLogger.info("Shutting down workers...");
	process.exit(0);
});

process.on("SIGTERM", () => {
	queueLogger.info("Shutting down workers...");
	process.exit(0);
});

// Start workers based on type
const workers: Promise<void>[] = [];

if (workerType === "images" || workerType === "all") {
	queueLogger.info("- Starting image variant worker");
	workers.push(
		startImageWorker().catch((error) => {
			queueLogger.error({ error }, "Image worker failed");
			throw error;
		}),
	);
}

if (workerType === "imports" || workerType === "all") {
	queueLogger.info("- Starting menu import worker");
	workers.push(
		startMenuImportWorker().catch((error) => {
			queueLogger.error({ error }, "Menu import worker failed");
			throw error;
		}),
	);
}

queueLogger.info("Press Ctrl+C to stop");

Promise.all(workers).catch((error) => {
	queueLogger.error({ error }, "Workers failed to start");
	process.exit(1);
});
