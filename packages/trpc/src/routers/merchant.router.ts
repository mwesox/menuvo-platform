/**
 * Merchant Router
 *
 * Handles merchant settings procedures:
 * - Merchant profile management
 * - General settings
 * - Language configuration
 */

import { merchants } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import {
	updateMerchantGeneralSchema,
	updateMerchantLanguagesSchema,
} from "../schemas/merchant.schema.js";
import { protectedProcedure, router } from "../trpc.js";

export const merchantRouter = router({
	/**
	 * Get current merchant
	 * Returns the merchant associated with the authenticated user's session
	 */
	getCurrent: protectedProcedure.query(async ({ ctx }) => {
		const merchantId = ctx.session.merchantId;

		const merchant = await ctx.db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
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
	 * Update merchant general settings
	 * Updates profile information like name, description, contact details
	 */
	updateGeneral: protectedProcedure
		.input(updateMerchantGeneralSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = ctx.session.merchantId;

			const [updatedMerchant] = await ctx.db
				.update(merchants)
				.set(input)
				.where(eq(merchants.id, merchantId))
				.returning();

			if (!updatedMerchant) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Merchant not found",
				});
			}

			return updatedMerchant;
		}),

	/**
	 * Update merchant supported languages
	 * Configures which languages are available for store content
	 */
	updateLanguages: protectedProcedure
		.input(updateMerchantLanguagesSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = ctx.session.merchantId;
			const { supportedLanguages } = input;

			const [updatedMerchant] = await ctx.db
				.update(merchants)
				.set({ supportedLanguages })
				.where(eq(merchants.id, merchantId))
				.returning();

			if (!updatedMerchant) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Merchant not found",
				});
			}

			return updatedMerchant;
		}),
});
