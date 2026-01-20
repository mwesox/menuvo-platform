/**
 * Store Settings Router
 *
 * Handles store settings procedures:
 * - Get store settings (protected)
 * - Get enabled order types (public, by slug)
 * - Save order types (store owner)
 */

import { mapDomainErrorToTRPC } from "../../../trpc/index.js";
import {
	protectedProcedure,
	publicProcedure,
	router,
	storeOwnerProcedure,
} from "../../../trpc/trpc.js";
import {
	getOrderTypesBySlugSchema,
	getStoreSettingsSchema,
	saveOrderTypesSchema,
} from "./schemas.js";

export const settingsRouter = router({
	/**
	 * Get store settings (for console)
	 * Protected: requires authenticated user and store ownership
	 */
	get: protectedProcedure
		.input(getStoreSettingsSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.storeSettings.getSettings(
					input.storeId,
					ctx.session.merchantId,
				);
			} catch (error) {
				mapDomainErrorToTRPC(error);
			}
		}),

	/**
	 * Get enabled order types by store slug (for shop, public)
	 */
	getOrderTypes: publicProcedure
		.input(getOrderTypesBySlugSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.storeSettings.getOrderTypes(input.slug);
			} catch (error) {
				mapDomainErrorToTRPC(error);
			}
		}),

	/**
	 * Save order types configuration
	 * Store Owner: requires store ownership
	 */
	saveOrderTypes: storeOwnerProcedure
		.input(saveOrderTypesSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.storeSettings.saveOrderTypes(
					input,
					ctx.session.merchantId,
				);
			} catch (error) {
				mapDomainErrorToTRPC(error);
			}
		}),
});

export type SettingsRouter = typeof settingsRouter;
