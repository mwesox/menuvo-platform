/**
 * Shop Menu Router
 *
 * Handles shop-facing menu procedures:
 * - Get complete menu (store + categories + items)
 * - Get item details with option groups
 */

import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../../../trpc/trpc.js";
import { getItemDetailsSchema } from "../items/schemas.js";
import { getMenuSchema } from "../schemas.js";

export const shopMenuRouter = router({
	/**
	 * Get full menu for a store (public)
	 * Returns store info, categories, and items in a single query
	 */
	getMenu: publicProcedure
		.input(getMenuSchema)
		.query(async ({ ctx, input }) => {
			try {
				const menuData = await ctx.services.shopMenu.getMenu(
					input.storeSlug,
					input.languageCode,
				);

				// Get store status using status service (no duplication)
				const status = await ctx.services.status.getStatusBySlug(
					input.storeSlug,
				);

				// Add status to store object
				return {
					...menuData,
					store: {
						...menuData.store,
						status,
					},
				};
			} catch (error) {
				if (error instanceof Error && error.message === "Store not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: error.message,
					});
				}
				throw error;
			}
		}),

	/**
	 * Get item details with option groups (public)
	 * Used for item detail pages, SEO, and sharing
	 */
	getItemDetails: publicProcedure
		.input(getItemDetailsSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.shopMenu.getItemDetails(
					input.itemId,
					input.languageCode,
				);
			} catch (error) {
				if (error instanceof Error && error.message === "Item not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: error.message,
					});
				}
				throw error;
			}
		}),
});

export type ShopMenuRouter = typeof shopMenuRouter;
