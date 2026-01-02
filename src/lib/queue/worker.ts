/**
 * Background workers entry point.
 * Run this as a separate process: bun run worker
 *
 * Runs both image variant and menu import workers concurrently.
 */
import { startWorker as startImageWorker } from "./image-queue";
import { startMenuImportWorker } from "./menu-import-queue";

console.log("Starting background workers...");
console.log("- Image variant worker");
console.log("- Menu import worker");
console.log("Press Ctrl+C to stop");

// Handle graceful shutdown
process.on("SIGINT", () => {
	console.log("\nShutting down workers...");
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log("\nShutting down workers...");
	process.exit(0);
});

// Start both workers concurrently
Promise.all([
	startImageWorker().catch((error) => {
		console.error("Image worker failed:", error);
		throw error;
	}),
	startMenuImportWorker().catch((error) => {
		console.error("Menu import worker failed:", error);
		throw error;
	}),
]).catch((error) => {
	console.error("Workers failed to start:", error);
	process.exit(1);
});
