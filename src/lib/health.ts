import { RedisClient } from "bun";
import { sql } from "drizzle-orm";

import { db } from "@/db";
import { env } from "@/env";

const redis = new RedisClient(env.REDIS_URL ?? "redis://localhost:6379");

type HealthStatus = "ok" | "error";

type HealthResponse = {
	status: HealthStatus;
	db: HealthStatus;
	redis: HealthStatus;
	timestamp: string;
};

export async function checkHealth(): Promise<{
	statusCode: number;
	payload: HealthResponse;
}> {
	let statusCode = 200;
	const checks: { db: HealthStatus; redis: HealthStatus } = {
		db: "ok",
		redis: "ok",
	};

	try {
		await db.execute(sql`select 1`);
	} catch {
		checks.db = "error";
		statusCode = 503;
	}

	try {
		await redis.send("PING", []);
	} catch {
		checks.redis = "error";
		statusCode = 503;
	}

	return {
		statusCode,
		payload: {
			status: statusCode === 200 ? "ok" : "error",
			...checks,
			timestamp: new Date().toISOString(),
		},
	};
}
