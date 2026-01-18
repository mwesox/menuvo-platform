/**
 * API Server Entry Point
 *
 * Hono + tRPC backend server (Bun runtime)
 */

import { trpcServer } from "@hono/trpc-server";
import { db } from "@menuvo/db";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createContext } from "./context.js";
import { appRouter } from "./domains/router.js";
import { env } from "./env.js";
import { mollie } from "./routes/mollie.js";

// Parse allowed origins from environment (comma-separated list)
const allowedOrigins = new Set(
	(env.ALLOWED_ORIGINS || "")
		.split(",")
		.map((o) => o.trim())
		.filter(Boolean),
);

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
	"*",
	cors({
		origin: (origin) => (allowedOrigins.has(origin) ? origin : null),
		credentials: true,
	}),
);

// Health check
app.get("/health", (c) => {
	return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mollie OAuth callback routes
app.route("/api/mollie", mollie);

// tRPC handler
app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: (opts) =>
			createContext({ db, req: opts.req, resHeaders: opts.resHeaders }),
	}),
);

// Start server
const port = Number(process.env.PORT) || 4000;

console.log(`🚀 API server starting on port ${port}`);

// Bun native server export
export default {
	port,
	fetch: app.fetch,
};
