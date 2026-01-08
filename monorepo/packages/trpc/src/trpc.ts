/**
 * tRPC Initialization
 *
 * This is the core tRPC setup file that initializes:
 * - The tRPC instance with context
 * - Reusable procedures (public and protected)
 * - Middleware for authentication
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context.js";

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
 * Export reusable router and middleware factories
 */
export const router = t.router;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;

/**
 * Public procedure - no authentication required
 * Use for public endpoints like menu viewing, store lookup
 */
export const publicProcedure = t.procedure;

/**
 * Authentication middleware
 * Ensures the user has a valid session before proceeding
 */
const isAuthenticated = middleware(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be logged in to access this resource",
		});
	}

	return next({
		ctx: {
			// Narrow the session type to be non-undefined
			session: ctx.session,
		},
	});
});

/**
 * Protected procedure - requires authentication
 * Use for endpoints that require a logged-in user
 */
export const protectedProcedure = t.procedure.use(isAuthenticated);

/**
 * Store owner middleware
 * Ensures the user is the owner of the store they're accessing
 */
const isStoreOwner = middleware(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be logged in to access this resource",
		});
	}

	if (!ctx.session.storeId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You must have a store to access this resource",
		});
	}

	if (ctx.session.role !== "owner" && ctx.session.role !== "admin") {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "You must be a store owner to access this resource",
		});
	}

	return next({
		ctx: {
			session: ctx.session,
			storeId: ctx.session.storeId,
		},
	});
});

/**
 * Store owner procedure - requires store ownership
 * Use for endpoints that modify store data
 */
export const storeOwnerProcedure = t.procedure.use(isStoreOwner);
