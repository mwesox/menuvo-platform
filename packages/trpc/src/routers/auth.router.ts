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
	 * Gracefully handles database errors and returns null
	 */
	getMerchantOrNull: publicProcedure.query(async ({ ctx }) => {
		console.log("[auth.getMerchantOrNull] Called:", {
			hasSession: !!ctx.session,
			merchantId: ctx.session?.merchantId || "(no session)",
		});

		if (!ctx.session?.merchantId) {
			console.log("[auth.getMerchantOrNull] No session, returning null");
			return null;
		}

		try {
			const merchant = await ctx.db.query.merchants.findFirst({
				where: eq(merchants.id, ctx.session.merchantId),
			});

			console.log("[auth.getMerchantOrNull] Result:", {
				found: !!merchant,
				merchantId: merchant?.id || "(not found)",
			});

			return merchant ?? null;
		} catch (error) {
			// Log error but don't throw - return null to indicate no merchant found
			// This allows the app to gracefully handle missing/invalid sessions
			console.error("[auth.getMerchantOrNull] Error fetching merchant:", error);
			return null;
		}
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
