/**
 * Auth Router
 *
 * Handles authentication-related procedures:
 * - Session management
 * - User profile
 * - Merchant access
 */

import { merchants } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

export const authRouter = router({
	/**
	 * Get current session information
	 * Returns null if not authenticated
	 */
	getSession: publicProcedure.query(({ ctx }) => {
		return ctx.session ?? null;
	}),

	/**
	 * Get current user profile
	 * Requires authentication
	 */
	me: protectedProcedure.query(({ ctx }) => {
		return {
			id: ctx.session.userId,
			merchantId: ctx.session.merchantId,
			role: ctx.session.role,
			storeId: ctx.session.storeId,
		};
	}),

	/**
	 * Get current merchant with full details
	 * Requires authentication, throws if merchant not found
	 */
	getMerchant: protectedProcedure.query(async ({ ctx }) => {
		const merchant = await ctx.db.query.merchants.findFirst({
			where: eq(merchants.id, ctx.session.merchantId),
		});

		if (!merchant) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Merchant not found",
			});
		}

		return merchant;
	}),

	/**
	 * Get current merchant or null if not authenticated/not found
	 * Public procedure for conditional merchant access
	 */
	getMerchantOrNull: publicProcedure.query(async ({ ctx }) => {
		if (!ctx.session?.merchantId) {
			return null;
		}

		const merchant = await ctx.db.query.merchants.findFirst({
			where: eq(merchants.id, ctx.session.merchantId),
		});

		return merchant ?? null;
	}),

	/**
	 * Logout current session
	 * TODO: Implement actual session invalidation
	 */
	logout: protectedProcedure.mutation(async () => {
		// TODO: Implement session invalidation
		return { success: true };
	}),
});
