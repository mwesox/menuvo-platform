/**
 * Item Router
 *
 * Handles menu item procedures:
 * - Item CRUD operations
 * - Item images
 * - Item ordering within categories
 */

import { categories, items } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
	createItemApiSchema,
	deleteItemSchema,
	getItemByIdSchema,
	listItemsByCategorySchema,
	listItemsByStoreSchema,
	reorderItemsSchema,
	toggleItemAvailabilitySchema,
	updateItemApiSchema,
} from "../schemas/item.schema.js";
import { publicProcedure, router, storeOwnerProcedure } from "../trpc.js";

export const itemRouter = router({
	/**
	 * List items for a category (public)
	 */
	listByCategory: publicProcedure
		.input(listItemsByCategorySchema)
		.query(async ({ ctx, input }) => {
			const categoryItems = await ctx.db.query.items.findMany({
				where: eq(items.categoryId, input.categoryId),
				orderBy: [asc(items.displayOrder), asc(items.createdAt)],
				with: {
					optGroups: {
						with: {
							optGroup: {
								with: {
									choices: true,
								},
							},
						},
						orderBy: (iog, { asc }) => [asc(iog.displayOrder)],
					},
				},
			});

			return categoryItems;
		}),

	/**
	 * List all items for a store (public)
	 */
	listByStore: publicProcedure
		.input(listItemsByStoreSchema)
		.query(async ({ ctx, input }) => {
			const storeItems = await ctx.db.query.items.findMany({
				where: eq(items.storeId, input.storeId),
				orderBy: [asc(items.displayOrder), asc(items.createdAt)],
				with: {
					category: true,
					optGroups: {
						with: {
							optGroup: {
								with: {
									choices: true,
								},
							},
						},
						orderBy: (iog, { asc }) => [asc(iog.displayOrder)],
					},
				},
			});

			return storeItems;
		}),

	/**
	 * Get item by ID
	 */
	getById: publicProcedure
		.input(getItemByIdSchema)
		.query(async ({ ctx, input }) => {
			const item = await ctx.db.query.items.findFirst({
				where: eq(items.id, input.id),
				with: {
					category: true,
					store: true,
					optGroups: {
						with: {
							optGroup: {
								with: {
									choices: true,
								},
							},
						},
						orderBy: (iog, { asc }) => [asc(iog.displayOrder)],
					},
				},
			});

			if (!item) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Item not found",
				});
			}

			return item;
		}),

	/**
	 * Create a new item
	 */
	create: storeOwnerProcedure
		.input(createItemApiSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the category belongs to the user's store
			const category = await ctx.db.query.categories.findFirst({
				where: and(
					eq(categories.id, input.categoryId),
					eq(categories.storeId, ctx.storeId),
				),
				columns: { id: true, storeId: true },
			});

			if (!category) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found or does not belong to your store",
				});
			}

			// Get the highest display order for items in this category
			const existingItems = await ctx.db.query.items.findMany({
				where: eq(items.categoryId, input.categoryId),
				columns: { displayOrder: true },
				orderBy: (items, { desc }) => [desc(items.displayOrder)],
				limit: 1,
			});

			const maxDisplayOrder = existingItems[0]?.displayOrder ?? -1;
			const displayOrder = input.displayOrder ?? maxDisplayOrder + 1;

			const [newItem] = await ctx.db
				.insert(items)
				.values({
					storeId: ctx.storeId,
					categoryId: input.categoryId,
					translations: input.translations,
					price: input.price,
					imageUrl: input.imageUrl ?? null,
					isAvailable: input.isAvailable,
					displayOrder,
					allergens: input.allergens ?? null,
					kitchenName: input.kitchenName ?? null,
				})
				.returning();

			if (!newItem) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create item",
				});
			}

			return newItem;
		}),

	/**
	 * Update an item
	 */
	update: storeOwnerProcedure
		.input(updateItemApiSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updates } = input;

			// Verify the item belongs to the user's store
			const existingItem = await ctx.db.query.items.findFirst({
				where: and(eq(items.id, id), eq(items.storeId, ctx.storeId)),
				columns: { id: true },
			});

			if (!existingItem) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Item not found or does not belong to your store",
				});
			}

			// If changing category, verify the new category belongs to the store
			if (updates.categoryId) {
				const category = await ctx.db.query.categories.findFirst({
					where: and(
						eq(categories.id, updates.categoryId),
						eq(categories.storeId, ctx.storeId),
					),
					columns: { id: true },
				});

				if (!category) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message:
							"Target category not found or does not belong to your store",
					});
				}
			}

			// Build update object, only including defined fields
			const updateData: Record<string, unknown> = {};
			if (updates.categoryId !== undefined)
				updateData.categoryId = updates.categoryId;
			if (updates.translations !== undefined)
				updateData.translations = updates.translations;
			if (updates.price !== undefined) updateData.price = updates.price;
			if (updates.imageUrl !== undefined)
				updateData.imageUrl = updates.imageUrl;
			if (updates.isAvailable !== undefined)
				updateData.isAvailable = updates.isAvailable;
			if (updates.displayOrder !== undefined)
				updateData.displayOrder = updates.displayOrder;
			if (updates.allergens !== undefined)
				updateData.allergens = updates.allergens;
			if (updates.kitchenName !== undefined)
				updateData.kitchenName = updates.kitchenName;

			const [updatedItem] = await ctx.db
				.update(items)
				.set(updateData)
				.where(eq(items.id, id))
				.returning();

			if (!updatedItem) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update item",
				});
			}

			return updatedItem;
		}),

	/**
	 * Delete an item
	 */
	delete: storeOwnerProcedure
		.input(deleteItemSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the item belongs to the user's store
			const item = await ctx.db.query.items.findFirst({
				where: and(eq(items.id, input.id), eq(items.storeId, ctx.storeId)),
				columns: { id: true },
			});

			if (!item) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Item not found or does not belong to your store",
				});
			}

			await ctx.db.delete(items).where(eq(items.id, input.id));

			return { success: true };
		}),

	/**
	 * Reorder items within a category
	 */
	reorder: storeOwnerProcedure
		.input(reorderItemsSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the category belongs to the user's store
			const category = await ctx.db.query.categories.findFirst({
				where: and(
					eq(categories.id, input.categoryId),
					eq(categories.storeId, ctx.storeId),
				),
				columns: { id: true },
			});

			if (!category) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found or does not belong to your store",
				});
			}

			// Verify all items belong to this category and the store
			const existingItems = await ctx.db.query.items.findMany({
				where: and(
					inArray(items.id, input.itemIds),
					eq(items.categoryId, input.categoryId),
					eq(items.storeId, ctx.storeId),
				),
				columns: { id: true },
			});

			if (existingItems.length !== input.itemIds.length) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Some items do not exist or do not belong to this category",
				});
			}

			// Update display order for each item in a transaction for atomicity
			await ctx.db.transaction(async (tx) => {
				for (let i = 0; i < input.itemIds.length; i++) {
					const itemId = input.itemIds[i];
					if (!itemId) continue;
					await tx
						.update(items)
						.set({ displayOrder: i })
						.where(eq(items.id, itemId));
				}
			});

			return { success: true };
		}),

	/**
	 * Toggle item availability
	 */
	toggleAvailability: storeOwnerProcedure
		.input(toggleItemAvailabilitySchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the item belongs to the user's store
			const item = await ctx.db.query.items.findFirst({
				where: and(eq(items.id, input.id), eq(items.storeId, ctx.storeId)),
				columns: { id: true },
			});

			if (!item) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Item not found or does not belong to your store",
				});
			}

			const [updatedItem] = await ctx.db
				.update(items)
				.set({ isAvailable: input.isAvailable })
				.where(eq(items.id, input.id))
				.returning();

			if (!updatedItem) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update item availability",
				});
			}

			return updatedItem;
		}),
});
