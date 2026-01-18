/**
 * tRPC Base Initialization
 *
 * This file initializes tRPC and exports the core factories.
 * It does NOT import any middleware to avoid circular dependencies.
 * Middleware files import from this file, and trpc.ts imports from both.
 */

import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "../context.js";

/**
 * Initialize tRPC with context and superjson transformer
 * Superjson allows passing complex types like Date, Map, Set over the wire
 */
const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				// Add custom error data if needed
				zodError:
					error.cause instanceof Error ? error.cause.message : undefined,
			},
		};
	},
});

/**
 * Export core tRPC factories
 * These are used by middleware implementations and procedure creators
 */
export const middleware = t.middleware;
export const router = t.router;
export const mergeRouters = t.mergeRouters;
export const publicProcedure = t.procedure;
