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
import { RedisClient } from "bun";
import { env } from "@/env";
import { queueLogger } from "@/lib/logger";
import { startWorker as startImageWorker } from "./image-queue";
import { startMenuImportWorker } from "./menu-import-queue";

// Redis client for health checks
const healthRedis = new RedisClient(env.REDIS_URL ?? "redis://localhost:6379");

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

// Start health server for monitoring
const healthPort = Number(process.env.HEALTH_PORT) || 3001;

Bun.serve({
	port: healthPort,
	async fetch(req) {
		const url = new URL(req.url);
		if (url.pathname === "/health") {
			let redisOk = true;
			try {
				await healthRedis.send("PING", []);
			} catch {
				redisOk = false;
			}

			return Response.json(
				{
					status: redisOk ? "ok" : "error",
					redis: redisOk ? "ok" : "error",
					workerType,
					uptime: process.uptime(),
					timestamp: new Date().toISOString(),
				},
				{ status: redisOk ? 200 : 503 },
			);
		}
		return new Response("Not Found", { status: 404 });
	},
});

queueLogger.info({ port: healthPort }, "Health server started");

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
