/**
 * Background Worker
 *
 * Single process handling:
 * - HTTP endpoints (health, webhooks, uploads)
 * - Queue processors (images, imports, stripe events, mollie events)
 *
 * Usage:
 *   bun run worker                    # Run all (default)
 *   bun run worker --type images      # Run only image processor
 *   bun run worker --type imports     # Run only menu import processor
 *   bun run worker --type stripe      # Run only Stripe event processor
 *   bun run worker --type mollie      # Run only Mollie event processor
 *   bun run worker --type all         # Run all processors
 */
import { parseArgs } from "node:util";
import { queueLogger } from "@/lib/logger";
import { handleRequest } from "./http/router";
import { startImageProcessor } from "./processors/images";
import { startImportProcessor } from "./processors/imports";
import { startMollieProcessor } from "./processors/mollie-events";
import { startStripeProcessor } from "./processors/stripe-events";

// Parse CLI arguments
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

if (!["images", "imports", "stripe", "mollie", "all"].includes(workerType)) {
	queueLogger.error(
		{ workerType },
		"Invalid worker type. Use: images, imports, stripe, mollie, or all",
	);
	process.exit(1);
}

queueLogger.info({ workerType }, "Starting background worker...");

// Start HTTP server
const port = Number(process.env.WORKER_PORT) || 3001;

Bun.serve({
	port,
	fetch: (req) => handleRequest(req, { workerType }),
});

queueLogger.info({ port }, "HTTP server started");

// Handle graceful shutdown
process.on("SIGINT", () => {
	queueLogger.info("Shutting down worker...");
	process.exit(0);
});

process.on("SIGTERM", () => {
	queueLogger.info("Shutting down worker...");
	process.exit(0);
});

// Start processors based on type
const processors: Promise<void>[] = [];

if (workerType === "images" || workerType === "all") {
	queueLogger.info("- Starting image variant processor");
	processors.push(
		startImageProcessor().catch((error) => {
			queueLogger.error({ error }, "Image processor failed");
			throw error;
		}),
	);
}

if (workerType === "imports" || workerType === "all") {
	queueLogger.info("- Starting menu import processor");
	processors.push(
		startImportProcessor().catch((error) => {
			queueLogger.error({ error }, "Menu import processor failed");
			throw error;
		}),
	);
}

if (workerType === "stripe" || workerType === "all") {
	queueLogger.info("- Starting Stripe event processor");
	processors.push(
		startStripeProcessor().catch((error) => {
			queueLogger.error({ error }, "Stripe event processor failed");
			throw error;
		}),
	);
}

if (workerType === "mollie" || workerType === "all") {
	queueLogger.info("- Starting Mollie event processor");
	processors.push(
		startMollieProcessor().catch((error) => {
			queueLogger.error({ error }, "Mollie event processor failed");
			throw error;
		}),
	);
}

queueLogger.info("Press Ctrl+C to stop");

Promise.all(processors).catch((error) => {
	queueLogger.error({ error }, "Processors failed to start");
	process.exit(1);
});
