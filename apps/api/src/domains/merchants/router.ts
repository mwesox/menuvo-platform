/**
 * Merchant Router
 *
 * Handles merchant settings procedures:
 * - Merchant profile management
 * - General settings
 * - Language configuration
 */

import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../../trpc/trpc.js";
import {
	updateMerchantGeneralSchema,
	updateMerchantLanguagesSchema,
} from "./schemas.js";

export const merchantRouter = router({
	/**
	 * Get current merchant
	 * Returns the merchant associated with the authenticated user's session
	 */
	getCurrent: protectedProcedure.query(async ({ ctx }) => {
		try {
			return await ctx.services.merchants.getMerchant(ctx.session.merchantId);
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
	 * Update merchant general settings
	 * Updates profile information like name, description, contact details
	 */
	updateGeneral: protectedProcedure
		.input(updateMerchantGeneralSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.merchants.updateMerchant(
					ctx.session.merchantId,
					input,
				);
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
	 * Update merchant supported languages
	 * Configures which languages are available for store content
	 */
	updateLanguages: protectedProcedure
		.input(updateMerchantLanguagesSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.merchants.updateLanguages(
					ctx.session.merchantId,
					input,
				);
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
});

export type MerchantRouter = typeof merchantRouter;
