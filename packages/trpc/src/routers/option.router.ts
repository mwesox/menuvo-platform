/**
 * Option Router
 *
 * Handles menu option-related procedures:
 * - Option groups CRUD
 * - Option choices CRUD
 * - Item-option associations
 */

import type { ChoiceTranslations, EntityTranslations } from "@menuvo/db/schema";
import {
	itemOptionGroups,
	items,
	optionChoices,
	optionGroups,
	stores,
} from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import type { Context, Session } from "../context.js";
import {
	createOptionChoiceSchema,
	createOptionGroupSchema,
	deleteOptionChoiceSchema,
	deleteOptionGroupSchema,
	getItemOptionsSchema,
	getOptionGroupSchema,
	listOptionChoicesSchema,
	listOptionGroupsSchema,
	saveOptionGroupWithChoicesSchema,
	toggleOptionChoiceAvailableSchema,
	toggleOptionGroupActiveSchema,
	updateItemOptionsSchema,
	updateOptionChoiceSchema,
	updateOptionGroupSchema,
} from "../schemas/option.schema.js";
import { protectedProcedure, router } from "../trpc.js";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get merchantId from session, throw if not found.
 */
function getMerchantId(session: Session): string {
	if (!session.merchantId) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "No merchant associated with this session",
		});
	}
	return session.merchantId;
}

/**
 * Derive selection constraints based on option group type.
 */
function deriveSelectionsFromType(
	type: "single_select" | "multi_select" | "quantity_select",
	inputMin: number,
	inputMax: number | null,
): { minSelections: number; maxSelections: number | null } {
	if (type === "single_select") {
		return { minSelections: 1, maxSelections: 1 };
	}
	return { minSelections: inputMin, maxSelections: inputMax };
}

/**
 * Validate store ownership.
 */
async function requireStoreOwnership(
	ctx: Pick<Context, "db">,
	storeId: string,
	merchantId: string,
) {
	const store = await ctx.db.query.stores.findFirst({
		where: eq(stores.id, storeId),
		columns: { id: true, merchantId: true },
	});
	if (!store || store.merchantId !== merchantId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Store not found or access denied",
		});
	}
	return store;
}

/**
 * Validate option group ownership.
 */
async function requireOptionGroupOwnership(
	ctx: Pick<Context, "db">,
	optionGroupId: string,
	merchantId: string,
) {
	const optionGroup = await ctx.db.query.optionGroups.findFirst({
		where: eq(optionGroups.id, optionGroupId),
		with: { store: { columns: { merchantId: true } } },
	});
	if (!optionGroup || optionGroup.store.merchantId !== merchantId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Option group not found or access denied",
		});
	}
	return optionGroup;
}

/**
 * Validate option choice ownership.
 */
async function requireOptionChoiceOwnership(
	ctx: Pick<Context, "db">,
	optionChoiceId: string,
	merchantId: string,
) {
	const optionChoice = await ctx.db.query.optionChoices.findFirst({
		where: eq(optionChoices.id, optionChoiceId),
		with: {
			optGroup: {
				with: { store: { columns: { merchantId: true } } },
			},
		},
	});
	if (!optionChoice || optionChoice.optGroup.store.merchantId !== merchantId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Option choice not found or access denied",
		});
	}
	return optionChoice;
}

/**
 * Validate item ownership.
 */
async function requireItemOwnership(
	ctx: Pick<Context, "db">,
	itemId: string,
	merchantId: string,
) {
	const item = await ctx.db.query.items.findFirst({
		where: eq(items.id, itemId),
		with: { store: { columns: { merchantId: true } } },
	});
	if (!item || item.store.merchantId !== merchantId) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Item not found or access denied",
		});
	}
	return item;
}

// ============================================================================
// OPTION ROUTER
// ============================================================================

export const optionRouter = router({
	// ============================================================================
	// OPTION GROUPS
	// ============================================================================

	/**
	 * Get all option groups for a store
	 */
	listGroups: protectedProcedure
		.input(listOptionGroupsSchema)
		.query(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);
			const store = await requireStoreOwnership(ctx, input.storeId, merchantId);

			const allOptionGroups = await ctx.db.query.optionGroups.findMany({
				where: eq(optionGroups.storeId, store.id),
				orderBy: [asc(optionGroups.displayOrder)],
				with: {
					choices: {
						orderBy: (choices, { asc }) => [asc(choices.displayOrder)],
					},
				},
			});
			return allOptionGroups;
		}),

	/**
	 * Get a single option group by ID
	 */
	getGroup: protectedProcedure
		.input(getOptionGroupSchema)
		.query(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);
			await requireOptionGroupOwnership(ctx, input.optionGroupId, merchantId);

			const optionGroup = await ctx.db.query.optionGroups.findFirst({
				where: eq(optionGroups.id, input.optionGroupId),
				with: {
					choices: {
						orderBy: (choices, { asc }) => [asc(choices.displayOrder)],
					},
					optGroups: true,
				},
			});

			if (!optionGroup) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Option group not found",
				});
			}

			// Return with item count
			return {
				...optionGroup,
				itemCount: optionGroup.optGroups.length,
			};
		}),

	/**
	 * Create a new option group
	 */
	createGroup: protectedProcedure
		.input(createOptionGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);
			const store = await requireStoreOwnership(ctx, input.storeId, merchantId);

			// Get max display order
			const existing = await ctx.db.query.optionGroups.findMany({
				where: eq(optionGroups.storeId, store.id),
				orderBy: (optionGroups, { desc }) => [desc(optionGroups.displayOrder)],
				limit: 1,
			});
			const maxOrder = existing[0]?.displayOrder ?? -1;

			const [newOptionGroup] = await ctx.db
				.insert(optionGroups)
				.values({
					storeId: store.id,
					translations: input.translations as EntityTranslations,
					type: input.type,
					minSelections: input.minSelections,
					maxSelections: input.maxSelections,
					isRequired: input.isRequired,
					numFreeOptions: input.numFreeOptions,
					aggregateMinQuantity: input.aggregateMinQuantity,
					aggregateMaxQuantity: input.aggregateMaxQuantity,
					displayOrder: input.displayOrder ?? maxOrder + 1,
				})
				.returning();

			return newOptionGroup;
		}),

	/**
	 * Update an option group
	 */
	updateGroup: protectedProcedure
		.input(updateOptionGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);
			await requireOptionGroupOwnership(ctx, input.optionGroupId, merchantId);

			const { optionGroupId, translations, ...updates } = input;

			const [updatedOptionGroup] = await ctx.db
				.update(optionGroups)
				.set({
					...updates,
					...(translations && {
						translations: translations as EntityTranslations,
					}),
				})
				.where(eq(optionGroups.id, optionGroupId))
				.returning();

			if (!updatedOptionGroup) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Option group not found",
				});
			}

			return updatedOptionGroup;
		}),

	/**
	 * Toggle option group active status
	 */
	toggleGroupActive: protectedProcedure
		.input(toggleOptionGroupActiveSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);
			await requireOptionGroupOwnership(ctx, input.optionGroupId, merchantId);

			const [updatedOptionGroup] = await ctx.db
				.update(optionGroups)
				.set({ isActive: input.isActive })
				.where(eq(optionGroups.id, input.optionGroupId))
				.returning();

			if (!updatedOptionGroup) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Option group not found",
				});
			}

			return updatedOptionGroup;
		}),

	/**
	 * Delete an option group
	 */
	deleteGroup: protectedProcedure
		.input(deleteOptionGroupSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);
			await requireOptionGroupOwnership(ctx, input.optionGroupId, merchantId);

			await ctx.db
				.delete(optionGroups)
				.where(eq(optionGroups.id, input.optionGroupId));
			return { success: true };
		}),

	/**
	 * Save option group with choices in one transaction
	 */
	saveGroupWithChoices: protectedProcedure
		.input(saveOptionGroupWithChoicesSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);

			const {
				optionGroupId,
				storeId,
				choices,
				type = "multi_select",
				minSelections: inputMinSelections,
				maxSelections: inputMaxSelections,
				numFreeOptions = 0,
				aggregateMinQuantity,
				aggregateMaxQuantity,
				translations,
			} = input;

			// Validate store ownership
			const store = await requireStoreOwnership(ctx, storeId, merchantId);

			// If updating, validate ownership
			if (optionGroupId) {
				await requireOptionGroupOwnership(ctx, optionGroupId, merchantId);
			}

			// Derive selection constraints based on type
			const { minSelections, maxSelections } = deriveSelectionsFromType(
				type,
				inputMinSelections ?? 0,
				inputMaxSelections ?? null,
			);

			// Derive isRequired from minSelections > 0
			const isRequired = minSelections > 0;

			return await ctx.db.transaction(async (tx) => {
				let savedGroup: typeof optionGroups.$inferSelect;

				if (optionGroupId) {
					// Update existing option group
					const [updated] = await tx
						.update(optionGroups)
						.set({
							translations: translations as EntityTranslations,
							type,
							minSelections,
							maxSelections,
							isRequired,
							numFreeOptions,
							aggregateMinQuantity,
							aggregateMaxQuantity,
						})
						.where(eq(optionGroups.id, optionGroupId))
						.returning();

					if (!updated) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Option group not found",
						});
					}
					savedGroup = updated;

					// Get existing choices to diff
					const existingChoices = await tx.query.optionChoices.findMany({
						where: eq(optionChoices.optionGroupId, optionGroupId),
					});
					const existingIds = new Set(existingChoices.map((c) => c.id));
					const newIds = new Set(
						choices
							.filter((c): c is typeof c & { id: string } => c.id !== undefined)
							.map((c) => c.id),
					);

					// Delete removed choices
					const toDelete = [...existingIds].filter((id) => !newIds.has(id));
					for (const choiceId of toDelete) {
						await tx
							.delete(optionChoices)
							.where(eq(optionChoices.id, choiceId));
					}

					// Update existing and create new choices
					for (const [i, choice] of choices.entries()) {
						if (choice.id) {
							// Update existing
							await tx
								.update(optionChoices)
								.set({
									translations: choice.translations as ChoiceTranslations,
									priceModifier: choice.priceModifier,
									displayOrder: i,
									isDefault: choice.isDefault ?? false,
									minQuantity: choice.minQuantity ?? 0,
									maxQuantity: choice.maxQuantity ?? null,
								})
								.where(eq(optionChoices.id, choice.id));
						} else {
							// Create new
							await tx.insert(optionChoices).values({
								optionGroupId,
								translations: choice.translations as ChoiceTranslations,
								priceModifier: choice.priceModifier,
								displayOrder: i,
								isDefault: choice.isDefault ?? false,
								minQuantity: choice.minQuantity ?? 0,
								maxQuantity: choice.maxQuantity ?? null,
							});
						}
					}
				} else {
					// Create new option group
					const existing = await tx.query.optionGroups.findMany({
						where: eq(optionGroups.storeId, store.id),
						orderBy: (og, { desc }) => [desc(og.displayOrder)],
						limit: 1,
					});
					const maxOrder = existing[0]?.displayOrder ?? -1;

					const [created] = await tx
						.insert(optionGroups)
						.values({
							storeId: store.id,
							translations: translations as EntityTranslations,
							type,
							minSelections,
							maxSelections,
							isRequired,
							numFreeOptions,
							aggregateMinQuantity,
							aggregateMaxQuantity,
							displayOrder: maxOrder + 1,
						})
						.returning();

					if (!created) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to create option group",
						});
					}
					savedGroup = created;

					// Create all choices
					for (const [i, choice] of choices.entries()) {
						await tx.insert(optionChoices).values({
							optionGroupId: savedGroup.id,
							translations: choice.translations as ChoiceTranslations,
							priceModifier: choice.priceModifier,
							displayOrder: i,
							isDefault: choice.isDefault ?? false,
							minQuantity: choice.minQuantity ?? 0,
							maxQuantity: choice.maxQuantity ?? null,
						});
					}
				}

				// Return the saved group with choices
				const result = await tx.query.optionGroups.findFirst({
					where: eq(optionGroups.id, savedGroup.id),
					with: {
						choices: {
							orderBy: (c, { asc }) => [asc(c.displayOrder)],
						},
					},
				});

				if (!result) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to save option group",
					});
				}
				return result;
			});
		}),

	// ============================================================================
	// OPTION CHOICES
	// ============================================================================

	/**
	 * List choices for an option group
	 */
	listChoices: protectedProcedure
		.input(listOptionChoicesSchema)
		.query(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);
			await requireOptionGroupOwnership(ctx, input.optionGroupId, merchantId);

			const allChoices = await ctx.db.query.optionChoices.findMany({
				where: eq(optionChoices.optionGroupId, input.optionGroupId),
				orderBy: [asc(optionChoices.displayOrder)],
			});
			return allChoices;
		}),

	/**
	 * Create a new option choice
	 */
	createChoice: protectedProcedure
		.input(createOptionChoiceSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);
			await requireOptionGroupOwnership(ctx, input.optionGroupId, merchantId);

			// Get max display order for this option group
			const existing = await ctx.db.query.optionChoices.findMany({
				where: eq(optionChoices.optionGroupId, input.optionGroupId),
				orderBy: (choices, { desc }) => [desc(choices.displayOrder)],
				limit: 1,
			});
			const maxOrder = existing[0]?.displayOrder ?? -1;

			const [newChoice] = await ctx.db
				.insert(optionChoices)
				.values({
					optionGroupId: input.optionGroupId,
					translations: input.translations as ChoiceTranslations,
					priceModifier: input.priceModifier,
					isDefault: input.isDefault,
					minQuantity: input.minQuantity,
					maxQuantity: input.maxQuantity,
					displayOrder: input.displayOrder ?? maxOrder + 1,
				})
				.returning();

			return newChoice;
		}),

	/**
	 * Update an option choice
	 */
	updateChoice: protectedProcedure
		.input(updateOptionChoiceSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);
			await requireOptionChoiceOwnership(ctx, input.optionChoiceId, merchantId);

			const { optionChoiceId, translations, ...updates } = input;

			const [updatedChoice] = await ctx.db
				.update(optionChoices)
				.set({
					...updates,
					...(translations && {
						translations: translations as ChoiceTranslations,
					}),
				})
				.where(eq(optionChoices.id, optionChoiceId))
				.returning();

			if (!updatedChoice) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Option choice not found",
				});
			}

			return updatedChoice;
		}),

	/**
	 * Toggle option choice available status
	 */
	toggleChoiceAvailable: protectedProcedure
		.input(toggleOptionChoiceAvailableSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);
			await requireOptionChoiceOwnership(ctx, input.optionChoiceId, merchantId);

			const [updatedChoice] = await ctx.db
				.update(optionChoices)
				.set({ isAvailable: input.isAvailable })
				.where(eq(optionChoices.id, input.optionChoiceId))
				.returning();

			if (!updatedChoice) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Option choice not found",
				});
			}

			return updatedChoice;
		}),

	/**
	 * Delete an option choice
	 */
	deleteChoice: protectedProcedure
		.input(deleteOptionChoiceSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);
			await requireOptionChoiceOwnership(ctx, input.optionChoiceId, merchantId);

			await ctx.db
				.delete(optionChoices)
				.where(eq(optionChoices.id, input.optionChoiceId));

			return { success: true };
		}),

	// ============================================================================
	// ITEM OPTIONS (Many-to-Many)
	// ============================================================================

	/**
	 * Get option groups for an item
	 */
	getItemOptions: protectedProcedure
		.input(getItemOptionsSchema)
		.query(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);
			await requireItemOwnership(ctx, input.itemId, merchantId);

			const itemOptions = await ctx.db.query.itemOptionGroups.findMany({
				where: eq(itemOptionGroups.itemId, input.itemId),
				orderBy: [asc(itemOptionGroups.displayOrder)],
				with: {
					optGroup: {
						with: {
							choices: {
								orderBy: (choices, { asc }) => [asc(choices.displayOrder)],
							},
						},
					},
				},
			});

			// Return the option groups with their choices
			return itemOptions.map((io) => io.optGroup);
		}),

	/**
	 * Update option groups for an item
	 */
	updateItemOptions: protectedProcedure
		.input(updateItemOptionsSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = getMerchantId(ctx.session);
			await requireItemOwnership(ctx, input.itemId, merchantId);

			const { itemId, optionGroupIds } = input;

			// Delete all existing item option links
			await ctx.db
				.delete(itemOptionGroups)
				.where(eq(itemOptionGroups.itemId, itemId));

			// Insert new links with display order
			if (optionGroupIds.length > 0) {
				await ctx.db.insert(itemOptionGroups).values(
					optionGroupIds.map((optionGroupId, index) => ({
						itemId,
						optionGroupId,
						displayOrder: index,
					})),
				);
			}

			// Return updated item options
			const updatedOptions = await ctx.db.query.itemOptionGroups.findMany({
				where: eq(itemOptionGroups.itemId, itemId),
				orderBy: [asc(itemOptionGroups.displayOrder)],
				with: {
					optGroup: {
						with: {
							choices: {
								orderBy: (choices, { asc }) => [asc(choices.displayOrder)],
							},
						},
					},
				},
			});

			return updatedOptions.map((io) => io.optGroup);
		}),
});
