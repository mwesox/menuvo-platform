/**
 * Menu Queries Router
 *
 * Provides optimized query endpoints that span multiple menu domains.
 * These endpoints replace multiple parallel fetches with single optimized queries.
 */

import { categories, stores } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { router, storeOwnerProcedure } from "../../../trpc/trpc.js";

/**
 * Input schema for getCategories
 */
const getCategoriesSchema = z.object({
	storeId: z.string(),
});

/**
 * Input schema for getCategory
 */
const getCategorySchema = z.object({
	categoryId: z.string(),
});

export const queriesRouter = router({
	/**
	 * Get categories with items (store owner only)
	 *
	 * Uses a single optimized Drizzle JOIN instead of parallel category + items fetches.
	 * Returns categories with items including validation data.
	 */
	getCategories: storeOwnerProcedure
		.input(getCategoriesSchema)
		.query(async ({ ctx, input }) => {
			// Verify the store belongs to the merchant and get default language
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, input.storeId),
					eq(stores.merchantId, ctx.session.merchantId),
				),
				columns: { id: true },
				with: {
					merchant: {
						columns: { supportedLanguages: true },
					},
				},
			});

			if (!store) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found",
				});
			}

			// First supported language is the default
			const defaultLanguage = store.merchant.supportedLanguages?.[0] ?? "de";

			return ctx.services.menuQueries.getCategories(
				input.storeId,
				defaultLanguage,
			);
		}),

	/**
	 * Get a single category with items (store owner only)
	 */
	getCategory: storeOwnerProcedure
		.input(getCategorySchema)
		.query(async ({ ctx, input }) => {
			// Verify the category belongs to a store owned by the merchant
			const category = await ctx.db.query.categories.findFirst({
				where: eq(categories.id, input.categoryId),
				with: {
					store: {
						columns: { merchantId: true },
					},
				},
			});

			if (!category || category.store.merchantId !== ctx.session.merchantId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found",
				});
			}

			return ctx.services.menuQueries.getCategory(input.categoryId);
		}),
});

export type QueriesRouter = typeof queriesRouter;
