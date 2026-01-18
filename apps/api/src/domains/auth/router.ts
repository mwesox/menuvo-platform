/**
 * Auth Router
 *
 * Handles authentication-related procedures:
 * - Session management
 * - User profile
 * - Merchant access
 * - Merchant onboarding (initial merchant + store creation)
 */

import { TRPCError } from "@trpc/server";
import { mapDomainErrorToTRPC } from "../../trpc/error-mapper.js";
import {
	protectedProcedure,
	publicProcedure,
	router,
} from "../../trpc/trpc.js";
import { devLoginSchema, onboardInputSchema } from "./schemas.js";

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
		try {
			return await ctx.services.auth.getMerchant(ctx.session.merchantId);
		} catch (error) {
			if (error instanceof Error && error.message === "Merchant not found") {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Merchant not found",
				});
			}
			throw error;
		}
	}),

	/**
	 * Get current merchant or null if not authenticated/not found
	 * Public procedure for conditional merchant access
	 * Gracefully handles database errors and returns null
	 */
	getMerchantOrNull: publicProcedure.query(async ({ ctx }) => {
		if (!ctx.session?.merchantId) {
			return null;
		}

		return await ctx.services.auth.getMerchantOrNull(ctx.session.merchantId);
	}),

	/**
	 * Logout current session
	 * Clears the authentication cookie
	 */
	logout: protectedProcedure.mutation(async ({ ctx }) => {
		if (!ctx.resHeaders) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Cannot clear cookie - resHeaders not available",
			});
		}

		const cookieDomain = process.env.COOKIE_DOMAIN;
		const cookieValue = ctx.services.auth.createClearAuthCookie(cookieDomain);
		ctx.resHeaders.set("Set-Cookie", cookieValue);

		return { success: true };
	}),

	/**
	 * Dev-only: List all merchants for dev login selector
	 * Returns merchants with their first store for display
	 */
	devListMerchants: publicProcedure.query(async ({ ctx }) => {
		return ctx.db.query.merchants.findMany({
			with: {
				stores: {
					limit: 1,
					columns: { name: true },
				},
			},
			columns: {
				id: true,
				name: true,
				ownerName: true,
				email: true,
			},
		});
	}),

	/**
	 * Dev-only: Log in as a specific merchant
	 * Sets the authentication cookie for the given merchant
	 */
	devLogin: publicProcedure
		.input(devLoginSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify merchant exists using domains service
			try {
				await ctx.services.auth.getMerchant(input.merchantId);
			} catch {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Merchant not found",
				});
			}

			// Set authentication cookie
			if (!ctx.resHeaders) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						"Cannot set authentication cookie - resHeaders not available",
				});
			}

			const cookieDomain = process.env.COOKIE_DOMAIN;
			const cookieValue = ctx.services.auth.createAuthCookie({
				merchantId: input.merchantId,
				cookieDomain,
			});

			ctx.resHeaders.set("Set-Cookie", cookieValue);

			return { success: true };
		}),

	/**
	 * Onboard a new merchant and create their first store
	 * Public procedure - no authentication required
	 * Sets authentication cookie after successful creation
	 */
	onboard: publicProcedure
		.input(onboardInputSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				// Delegate to onboarding service
				const result = await ctx.services.onboarding.onboard(input);

				// Set authentication cookie via resHeaders (tRPC fetch adapter)
				if (!ctx.resHeaders) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message:
							"Cannot set authentication cookie - resHeaders not available",
					});
				}

				const cookieDomain = process.env.COOKIE_DOMAIN;
				const cookieValue = ctx.services.auth.createAuthCookie({
					merchantId: result.merchant.id,
					cookieDomain,
				});

				ctx.resHeaders.set("Set-Cookie", cookieValue);

				return result;
			} catch (error) {
				mapDomainErrorToTRPC(error);
			}
		}),
});

export type AuthRouter = typeof authRouter;
