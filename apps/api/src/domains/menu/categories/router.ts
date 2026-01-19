/**
 * Category Router
 *
 * Handles menu category procedures:
 * - Category CRUD operations
 * - Category ordering
 * - Category active status toggling
 *
 * Categories support translations stored as JSONB: {"de": {name, description}, "en": {...}}
 */

import { stores } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
	publicProcedure,
	router,
	storeOwnerProcedure,
} from "../../../trpc/trpc.js";
import {
	createCategorySchema,
	deleteCategorySchema,
	getCategoryByIdSchema,
	listCategoriesSchema,
	reorderCategoriesSchema,
	toggleCategoryActiveSchema,
	updateCategorySchema,
} from "./schemas.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./types.js";

export const categoryRouter = router({
	/**
	 * List categories for a store (public)
	 * Returns categories ordered by displayOrder for storefront display
	 * Includes basic item information for console display
	 */
	list: publicProcedure
		.input(listCategoriesSchema)
		.query(async ({ ctx, input }) => {
			return ctx.services.categories.list(input.storeId);
		}),

	/**
	 * Get category by ID (public)
	 * Returns category with translations and items for display
	 */
	getById: publicProcedure
		.input(getCategoryByIdSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.categories.getById(input.id);
			} catch (error) {
				if (error instanceof Error && error.message === "Category not found") {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: error.message,
					});
				}
				throw error;
			}
		}),

	/**
	 * Create a new category (store owner only)
	 * Automatically sets displayOrder to append at end if not provided
	 */
	create: storeOwnerProcedure
		.input(createCategorySchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the store belongs to the merchant
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, input.storeId),
					eq(stores.merchantId, ctx.session.merchantId),
				),
				columns: { id: true },
			});

			if (!store) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found",
				});
			}

			const categoryInput: CreateCategoryInput = {
				storeId: input.storeId,
				translations: input.translations,
				displayOrder: input.displayOrder,
				isActive: input.isActive,
			};

			try {
				return await ctx.services.categories.create(
					ctx.session.merchantId,
					categoryInput,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("Failed to create")) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Update a category (store owner only)
	 * Only updates provided fields
	 */
	update: storeOwnerProcedure
		.input(updateCategorySchema)
		.mutation(async ({ ctx, input }) => {
			const updateInput: UpdateCategoryInput = {
				translations: input.translations,
				displayOrder: input.displayOrder,
				isActive: input.isActive,
				defaultVatGroupId: input.defaultVatGroupId,
			};

			try {
				return await ctx.services.categories.update(
					input.id,
					ctx.session.merchantId,
					updateInput,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Category not found") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("permission")) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: error.message,
						});
					}
					if (error.message.includes("Failed to update")) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Delete a category (store owner only)
	 * Note: This will cascade delete all items in the category
	 */
	delete: storeOwnerProcedure
		.input(deleteCategorySchema)
		.mutation(async ({ ctx, input }) => {
			try {
				await ctx.services.categories.delete(input.id, ctx.session.merchantId);
				return { success: true };
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Category not found") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("permission")) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Reorder categories (store owner only)
	 * Updates displayOrder based on array index
	 */
	reorder: storeOwnerProcedure
		.input(reorderCategoriesSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the store belongs to the merchant
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, input.storeId),
					eq(stores.merchantId, ctx.session.merchantId),
				),
				columns: { id: true },
			});

			if (!store) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found",
				});
			}

			try {
				return await ctx.services.categories.reorder(
					input.storeId,
					input.categoryIds,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message.includes("not found in store")) {
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),

	/**
	 * Toggle category active status (store owner only)
	 * Convenience endpoint for quick enable/disable
	 */
	toggleActive: storeOwnerProcedure
		.input(toggleCategoryActiveSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.categories.toggleActive(
					input.id,
					ctx.session.merchantId,
					input.isActive,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Category not found") {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: error.message,
						});
					}
					if (error.message.includes("permission")) {
						throw new TRPCError({
							code: "FORBIDDEN",
							message: error.message,
						});
					}
					if (error.message.includes("Failed to update")) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: error.message,
						});
					}
				}
				throw error;
			}
		}),
});

export type CategoryRouter = typeof categoryRouter;
