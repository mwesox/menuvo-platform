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

import { categories, stores } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import {
	createCategorySchema,
	deleteCategorySchema,
	getCategoryByIdSchema,
	listCategoriesSchema,
	reorderCategoriesSchema,
	toggleCategoryActiveSchema,
	updateCategorySchema,
} from "../schemas/category.schema.js";
import { publicProcedure, router, storeOwnerProcedure } from "../trpc.js";

export const categoryRouter = router({
	/**
	 * List categories for a store (public)
	 * Returns categories ordered by displayOrder for storefront display
	 * Includes basic item information for console display
	 */
	list: publicProcedure
		.input(listCategoriesSchema)
		.query(async ({ ctx, input }) => {
			return ctx.db.query.categories.findMany({
				where: eq(categories.storeId, input.storeId),
				orderBy: [asc(categories.displayOrder)],
				with: {
					items: {
						columns: {
							id: true,
							isAvailable: true,
							imageUrl: true,
						},
					},
				},
			});
		}),

	/**
	 * Get category by ID (public)
	 * Returns category with translations and items for display
	 */
	getById: publicProcedure
		.input(getCategoryByIdSchema)
		.query(async ({ ctx, input }) => {
			const category = await ctx.db.query.categories.findFirst({
				where: eq(categories.id, input.id),
				with: {
					items: {
						columns: {
							id: true,
							translations: true,
							price: true,
							imageUrl: true,
							isAvailable: true,
						},
					},
				},
			});

			if (!category) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found",
				});
			}

			return category;
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

			// Get max displayOrder if not provided
			let displayOrder = input.displayOrder;
			if (displayOrder === undefined) {
				const existingCategories = await ctx.db.query.categories.findMany({
					where: eq(categories.storeId, input.storeId),
					columns: { displayOrder: true },
				});
				const maxOrder = existingCategories.reduce(
					(max, cat) => Math.max(max, cat.displayOrder),
					-1,
				);
				displayOrder = maxOrder + 1;
			}

			const [newCategory] = await ctx.db
				.insert(categories)
				.values({
					storeId: input.storeId,
					translations: input.translations,
					displayOrder,
					isActive: input.isActive,
				})
				.returning();

			if (!newCategory) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create category",
				});
			}

			return newCategory;
		}),

	/**
	 * Update a category (store owner only)
	 * Only updates provided fields
	 */
	update: storeOwnerProcedure
		.input(updateCategorySchema)
		.mutation(async ({ ctx, input }) => {
			// Verify ownership via store
			const existingCategory = await ctx.db.query.categories.findFirst({
				where: eq(categories.id, input.id),
				with: {
					store: {
						columns: { merchantId: true },
					},
				},
			});

			if (!existingCategory) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found",
				});
			}

			if (existingCategory.store.merchantId !== ctx.session.merchantId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to update this category",
				});
			}

			// Build update object with only defined fields
			const updateData: Record<string, unknown> = {};
			if (input.translations !== undefined) {
				updateData.translations = input.translations;
			}
			if (input.displayOrder !== undefined) {
				updateData.displayOrder = input.displayOrder;
			}
			if (input.isActive !== undefined) {
				updateData.isActive = input.isActive;
			}

			// Only update if there's something to update
			if (Object.keys(updateData).length === 0) {
				return existingCategory;
			}

			const [updatedCategory] = await ctx.db
				.update(categories)
				.set(updateData)
				.where(eq(categories.id, input.id))
				.returning();

			if (!updatedCategory) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update category",
				});
			}

			return updatedCategory;
		}),

	/**
	 * Delete a category (store owner only)
	 * Note: This will cascade delete all items in the category
	 */
	delete: storeOwnerProcedure
		.input(deleteCategorySchema)
		.mutation(async ({ ctx, input }) => {
			// Verify ownership via store
			const existingCategory = await ctx.db.query.categories.findFirst({
				where: eq(categories.id, input.id),
				with: {
					store: {
						columns: { merchantId: true },
					},
				},
			});

			if (!existingCategory) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found",
				});
			}

			if (existingCategory.store.merchantId !== ctx.session.merchantId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to delete this category",
				});
			}

			await ctx.db.delete(categories).where(eq(categories.id, input.id));

			return { success: true };
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

			// Verify all categories belong to the store
			const existingCategories = await ctx.db.query.categories.findMany({
				where: eq(categories.storeId, input.storeId),
				columns: { id: true },
			});

			const existingIds = new Set(existingCategories.map((c) => c.id));
			const invalidIds = input.categoryIds.filter((id) => !existingIds.has(id));

			if (invalidIds.length > 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Categories not found in store: ${invalidIds.join(", ")}`,
				});
			}

			// Update displayOrder in a transaction
			await ctx.db.transaction(async (tx) => {
				const updates = input.categoryIds.map((categoryId, index) =>
					tx
						.update(categories)
						.set({ displayOrder: index })
						.where(eq(categories.id, categoryId)),
				);
				await Promise.all(updates);
			});

			return { success: true };
		}),

	/**
	 * Toggle category active status (store owner only)
	 * Convenience endpoint for quick enable/disable
	 */
	toggleActive: storeOwnerProcedure
		.input(toggleCategoryActiveSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify ownership via store
			const existingCategory = await ctx.db.query.categories.findFirst({
				where: eq(categories.id, input.id),
				with: {
					store: {
						columns: { merchantId: true },
					},
				},
			});

			if (!existingCategory) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found",
				});
			}

			if (existingCategory.store.merchantId !== ctx.session.merchantId) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to update this category",
				});
			}

			const [updatedCategory] = await ctx.db
				.update(categories)
				.set({ isActive: input.isActive })
				.where(eq(categories.id, input.id))
				.returning();

			if (!updatedCategory) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update category status",
				});
			}

			return updatedCategory;
		}),
});
