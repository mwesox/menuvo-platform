/**
 * Image variant worker entry point.
 * Run this as a separate process: bun run worker
 */
import { startWorker } from "./image-queue";

console.log("Starting image variant worker...");
console.log("Press Ctrl+C to stop");

// Handle graceful shutdown
process.on("SIGINT", () => {
	console.log("\nShutting down worker...");
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log("\nShutting down worker...");
	process.exit(0);
});

// Start the worker
startWorker().catch((error) => {
	console.error("Worker failed to start:", error);
	process.exit(1);
});
