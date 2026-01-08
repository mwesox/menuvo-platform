/**
 * API Server Entry Point
 *
 * Hono + tRPC backend server
 */

import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { db } from "@menuvo/db";
import { appRouter } from "@menuvo/trpc";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createContext } from "./context.js";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
	"*",
	cors({
		origin: [
			"http://localhost:3000",
			"http://localhost:3001",
			"http://localhost:3002",
		],
		credentials: true,
	}),
);

// Health check
app.get("/health", (c) => {
	return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// tRPC handler
app.use(
	"/trpc/*",
	trpcServer({
		router: appRouter,
		createContext: ({ req }) => createContext({ db, req }),
	}),
);

// Start server
const port = Number(process.env.PORT) || 4000;

console.log(`🚀 API server starting on port ${port}`);

serve({
	fetch: app.fetch,
	port,
});

export default app;
