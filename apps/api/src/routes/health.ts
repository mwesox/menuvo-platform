/**
 * Health Check Route
 *
 * Simple endpoint for monitoring and load balancers.
 */

import type { Hono } from "hono";

export function registerHealthRoute(app: Hono) {
	app.get("/health", (c) => {
		return c.json({ status: "ok", timestamp: new Date().toISOString() });
	});
}
