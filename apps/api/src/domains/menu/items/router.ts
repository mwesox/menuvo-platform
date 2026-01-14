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
import { and, eq } from "drizzle-orm";
import {
	publicProcedure,
	router,
	storeOwnerProcedure,
} from "../../../trpc/trpc.js";
import {
	createItemApiSchema,
	deleteItemSchema,
	getItemByIdSchema,
	listItemsByCategorySchema,
	listItemsByStoreSchema,
	reorderItemsSchema,
	toggleItemAvailabilitySchema,
	updateItemApiSchema,
} from "./schemas.js";
import type { CreateItemInput, UpdateItemInput } from "./types.js";

export const itemRouter = router({
	/**
	 * List items for a category (public)
	 */
	listByCategory: publicProcedure
		.input(listItemsByCategorySchema)
		.query(async ({ ctx, input }) => {
			return ctx.services.items.listByCategory(input.categoryId);
		}),

	/**
	 * List all items for a store (public)
	 */
	listByStore: publicProcedure
		.input(listItemsByStoreSchema)
		.query(async ({ ctx, input }) => {
			return ctx.services.items.listByStore(input.storeId);
		}),

	/**
	 * Get item by ID
	 */
	getById: publicProcedure
		.input(getItemByIdSchema)
		.query(async ({ ctx, input }) => {
			try {
				return await ctx.services.items.getById(input.id);
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

	/**
	 * Create a new item
	 */
	create: storeOwnerProcedure
		.input(createItemApiSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the category belongs to the user's merchant and get storeId
			const category = await ctx.db.query.categories.findFirst({
				where: eq(categories.id, input.categoryId),
				columns: { id: true, storeId: true },
				with: {
					store: {
						columns: { merchantId: true },
					},
				},
			});

			if (!category || category.store.merchantId !== ctx.session.merchantId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found or does not belong to your store",
				});
			}

			const itemInput: CreateItemInput = {
				categoryId: input.categoryId,
				translations: input.translations,
				price: input.price,
				imageUrl: input.imageUrl,
				isAvailable: input.isAvailable,
				displayOrder: input.displayOrder,
				allergens: input.allergens,
				kitchenName: input.kitchenName,
			};

			try {
				return await ctx.services.items.create(category.storeId, itemInput);
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
	 * Update an item
	 */
	update: storeOwnerProcedure
		.input(updateItemApiSchema)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updates } = input;

			// If changing category, verify the new category belongs to the same store
			if (updates.categoryId) {
				const existingItem = await ctx.db.query.items.findFirst({
					where: eq(items.id, id),
					columns: { storeId: true },
				});

				if (existingItem) {
					const category = await ctx.db.query.categories.findFirst({
						where: and(
							eq(categories.id, updates.categoryId),
							eq(categories.storeId, existingItem.storeId),
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
			}

			const updateInput: UpdateItemInput = {
				categoryId: updates.categoryId,
				translations: updates.translations,
				price: updates.price,
				imageUrl: updates.imageUrl,
				isAvailable: updates.isAvailable,
				displayOrder: updates.displayOrder,
				allergens: updates.allergens,
				kitchenName: updates.kitchenName,
			};

			try {
				return await ctx.services.items.update(
					id,
					ctx.session.merchantId,
					updateInput,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Item not found") {
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
	 * Delete an item
	 */
	delete: storeOwnerProcedure
		.input(deleteItemSchema)
		.mutation(async ({ ctx, input }) => {
			try {
				await ctx.services.items.delete(input.id, ctx.session.merchantId);
				return { success: true };
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Item not found") {
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
	 * Reorder items within a category
	 */
	reorder: storeOwnerProcedure
		.input(reorderItemsSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify the category belongs to the user's merchant
			const category = await ctx.db.query.categories.findFirst({
				where: eq(categories.id, input.categoryId),
				columns: { id: true, storeId: true },
				with: {
					store: {
						columns: { merchantId: true },
					},
				},
			});

			if (!category || category.store.merchantId !== ctx.session.merchantId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found or does not belong to your store",
				});
			}

			try {
				return await ctx.services.items.reorder(
					input.categoryId,
					input.itemIds,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (
						error.message.includes("not exist") ||
						error.message.includes("not belong")
					) {
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
	 * Toggle item availability
	 */
	toggleAvailability: storeOwnerProcedure
		.input(toggleItemAvailabilitySchema)
		.mutation(async ({ ctx, input }) => {
			try {
				return await ctx.services.items.toggleAvailability(
					input.id,
					ctx.session.merchantId,
					input.isAvailable,
				);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === "Item not found") {
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

export type ItemRouter = typeof itemRouter;
