/**
 * Store owner middleware
 * Ensures the user is the owner of the store they're accessing
 * Adds storeId to context from session for use in router procedures
 */
import { TRPCError } from "@trpc/server";
import { middleware } from "../t.js";

export const isStoreOwner = middleware(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "You must be logged in to access this resource",
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
			merchantId: ctx.session.merchantId,
			storeId: ctx.session.storeId ?? "",
		},
	});
});
