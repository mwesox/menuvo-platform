/**
 * Background workers entry point.
 * Run this as a separate process: bun run worker
 *
 * Runs both image variant and menu import workers concurrently.
 */
import { queueLogger } from "@/lib/logger";
import { startWorker as startImageWorker } from "./image-queue";
import { startMenuImportWorker } from "./menu-import-queue";

queueLogger.info("Starting background workers...");
queueLogger.info("- Image variant worker");
queueLogger.info("- Menu import worker");
queueLogger.info("Press Ctrl+C to stop");

// Handle graceful shutdown
process.on("SIGINT", () => {
	queueLogger.info("Shutting down workers...");
	process.exit(0);
});

process.on("SIGTERM", () => {
	queueLogger.info("Shutting down workers...");
	process.exit(0);
});

// Start both workers concurrently
Promise.all([
	startImageWorker().catch((error) => {
		queueLogger.error({ error }, "Image worker failed");
		throw error;
	}),
	startMenuImportWorker().catch((error) => {
		queueLogger.error({ error }, "Menu import worker failed");
		throw error;
	}),
]).catch((error) => {
	queueLogger.error({ error }, "Workers failed to start");
	process.exit(1);
});
