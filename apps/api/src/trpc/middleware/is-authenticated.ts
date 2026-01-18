/**
 * Authentication middleware
 * Ensures the user has a valid session before proceeding
 */
import { TRPCError } from "@trpc/server";
import { middleware } from "../t.js";

export const isAuthenticated = middleware(({ ctx, next }) => {
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
