/**
 * AI Recommendations Router
 *
 * Handles AI recommendations procedures:
 * - Get AI settings (protected)
 * - Save AI settings (store owner)
 * - Get recommendations (public, by slug)
 */

import { mapDomainErrorToTRPC } from "../../../trpc";
import {
	protectedProcedure,
	publicProcedure,
	router,
	storeOwnerProcedure,
} from "../../../trpc/trpc";
import {
	getAiSettingsSchema,
	getRecommendationsSchema,
	saveAiSettingsSchema,
} from "./schemas";

export const recommendationsRouter = router({
	/**
	 * Get AI settings (for console)
	 * Protected: requires authenticated user and store ownership
	 */
	getAiSettings: protectedProcedure
		.input(getAiSettingsSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.recommendations.getAiSettings(
					input.storeId,
					ctx.session.merchantId,
				);
			} catch (error) {
				mapDomainErrorToTRPC(error);
			}
		}),

	/**
	 * Save AI settings configuration
	 * Store Owner: requires store ownership
	 */
	saveAiSettings: storeOwnerProcedure
		.input(saveAiSettingsSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.recommendations.saveAiSettings(
					input,
					ctx.session.merchantId,
				);
			} catch (error) {
				mapDomainErrorToTRPC(error);
			}
		}),

	/**
	 * Get AI-powered recommendations for checkout (public, by slug)
	 * Returns empty array on failure (graceful degradation)
	 */
	getRecommendations: publicProcedure
		.input(getRecommendationsSchema)
		.query(async ({ ctx, input }) => {
			return await ctx.services.recommendations.getRecommendations(input);
		}),
});

export type RecommendationsRouter = typeof recommendationsRouter;
