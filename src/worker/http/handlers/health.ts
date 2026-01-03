import { RedisClient } from "bun";
import { env } from "@/env";

// Redis client for health checks
const healthRedis = new RedisClient(env.REDIS_URL ?? "redis://localhost:6379");

interface HealthCheckContext {
	workerType: string;
}

/**
 * Handle health check requests.
 * Checks Redis connectivity and returns worker status.
 */
export async function handleHealth(ctx: HealthCheckContext): Promise<Response> {
	let redisOk = true;
	try {
		await healthRedis.send("PING", []);
	} catch {
		redisOk = false;
	}

	const body = {
		status: redisOk ? "ok" : "error",
		redis: redisOk ? "ok" : "error",
		workerType: ctx.workerType,
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
	};

	return Response.json(body, { status: redisOk ? 200 : 503 });
}
