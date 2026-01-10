/**
 * API Server Entry Point
 *
 * Hono + tRPC backend server (Bun runtime)
 */

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
		origin: (origin) => {
			// Allow all *.menuvo.app subdomains
			if (origin.endsWith(".menuvo.app") || origin === "https://menuvo.app") {
				return origin;
			}
			// Allow localhost in dev
			if (origin.startsWith("http://localhost:")) {
				return origin;
			}
			return null;
		},
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
