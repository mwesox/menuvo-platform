"use server";

import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
	itemOptionGroups,
	items,
	optionChoices,
	optionGroups,
} from "@/db/schema.ts";
import { withAuth } from "../../auth/server/auth-middleware.ts";
import { requireStoreOwnership } from "../../auth/server/ownership.ts";
import {
	createOptionChoiceSchema,
	createOptionGroupSchema,
	deriveSelectionsFromType,
	saveOptionGroupWithChoicesSchema,
	updateItemOptionsSchema,
	updateOptionChoiceSchema,
	updateOptionGroupSchema,
} from "../options.schemas.ts";

// ============================================================================
// OWNERSHIP HELPERS
// ============================================================================

async function requireOptionGroupOwnership(
	optionGroupId: string,
	merchantId: string,
) {
	const optionGroup = await db.query.optionGroups.findFirst({
		where: eq(optionGroups.id, optionGroupId),
		with: { store: { columns: { merchantId: true } } },
	});
	if (!optionGroup || optionGroup.store.merchantId !== merchantId) {
		throw new Error("Option group not found or access denied");
	}
	return optionGroup;
}

async function requireOptionChoiceOwnership(
	optionChoiceId: string,
	merchantId: string,
) {
	const optionChoice = await db.query.optionChoices.findFirst({
		where: eq(optionChoices.id, optionChoiceId),
		with: {
			optGroup: {
				with: { store: { columns: { merchantId: true } } },
			},
		},
	});
	if (!optionChoice || optionChoice.optGroup.store.merchantId !== merchantId) {
		throw new Error("Option choice not found or access denied");
	}
	return optionChoice;
}

async function requireItemOwnership(itemId: string, merchantId: string) {
	const item = await db.query.items.findFirst({
		where: eq(items.id, itemId),
		with: { store: { columns: { merchantId: true } } },
	});
	if (!item || item.store.merchantId !== merchantId) {
		throw new Error("Item not found or access denied");
	}
	return item;
}

// ============================================================================
// OPTION GROUPS
// ============================================================================

export const getOptionGroups = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.inputValidator(z.object({ storeId: z.string().uuid() }))
	.handler(async ({ context, data }) => {
		const store = await requireStoreOwnership(
			data.storeId,
			context.auth.merchantId,
		);
		const allOptionGroups = await db.query.optionGroups.findMany({
			where: eq(optionGroups.storeId, store.id),
			orderBy: [asc(optionGroups.displayOrder)],
			with: {
				choices: {
					orderBy: (choices, { asc }) => [asc(choices.displayOrder)],
				},
			},
		});
		return allOptionGroups;
	});

export const getOptionGroup = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.inputValidator(z.object({ optionGroupId: z.string().uuid() }))
	.handler(async ({ context, data }) => {
		await requireOptionGroupOwnership(
			data.optionGroupId,
			context.auth.merchantId,
		);

		const optionGroup = await db.query.optionGroups.findFirst({
			where: eq(optionGroups.id, data.optionGroupId),
			with: {
				choices: {
					orderBy: (choices, { asc }) => [asc(choices.displayOrder)],
				},
				optGroups: true,
			},
		});

		if (!optionGroup) {
			throw new Error("Option group not found");
		}

		// Return with item count
		return {
			...optionGroup,
			itemCount: optionGroup.optGroups.length,
		};
	});

export const createOptionGroup = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(createOptionGroupSchema)
	.handler(async ({ context, data }) => {
		const store = await requireStoreOwnership(
			data.storeId,
			context.auth.merchantId,
		);

		// Get max display order
		const existing = await db.query.optionGroups.findMany({
			where: eq(optionGroups.storeId, store.id),
			orderBy: (optionGroups, { desc }) => [desc(optionGroups.displayOrder)],
			limit: 1,
		});
		const maxOrder = existing[0]?.displayOrder ?? -1;

		const [newOptionGroup] = await db
			.insert(optionGroups)
			.values({
				...data,
				storeId: store.id,
				displayOrder: data.displayOrder ?? maxOrder + 1,
			})
			.returning();

		return newOptionGroup;
	});

export const updateOptionGroup = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(
		updateOptionGroupSchema.extend({ optionGroupId: z.string().uuid() }),
	)
	.handler(async ({ context, data }) => {
		await requireOptionGroupOwnership(
			data.optionGroupId,
			context.auth.merchantId,
		);

		const { optionGroupId, ...updates } = data;

		const [updatedOptionGroup] = await db
			.update(optionGroups)
			.set(updates)
			.where(eq(optionGroups.id, optionGroupId))
			.returning();

		if (!updatedOptionGroup) {
			throw new Error("Option group not found");
		}

		return updatedOptionGroup;
	});

export const toggleOptionGroupActive = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(
		z.object({ optionGroupId: z.string().uuid(), isActive: z.boolean() }),
	)
	.handler(async ({ context, data }) => {
		await requireOptionGroupOwnership(
			data.optionGroupId,
			context.auth.merchantId,
		);

		const [updatedOptionGroup] = await db
			.update(optionGroups)
			.set({ isActive: data.isActive })
			.where(eq(optionGroups.id, data.optionGroupId))
			.returning();

		if (!updatedOptionGroup) {
			throw new Error("Option group not found");
		}

		return updatedOptionGroup;
	});

export const deleteOptionGroup = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(z.object({ optionGroupId: z.string().uuid() }))
	.handler(async ({ context, data }) => {
		await requireOptionGroupOwnership(
			data.optionGroupId,
			context.auth.merchantId,
		);

		// Cascade deletes are handled by database constraints
		// (choices and item links will be deleted automatically)
		await db
			.delete(optionGroups)
			.where(eq(optionGroups.id, data.optionGroupId));
		return { success: true };
	});

// Save option group with choices in one transaction
export const saveOptionGroupWithChoices = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(saveOptionGroupWithChoicesSchema)
	.handler(async ({ context, data }) => {
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
			...groupData
		} = data;

		// Validate store ownership
		const store = await requireStoreOwnership(storeId, context.auth.merchantId);

		// If updating, validate ownership
		if (optionGroupId) {
			await requireOptionGroupOwnership(optionGroupId, context.auth.merchantId);
		}

		// Derive selection constraints based on type
		const { minSelections, maxSelections } = deriveSelectionsFromType(
			type,
			inputMinSelections ?? 0,
			inputMaxSelections ?? null,
		);

		// Derive isRequired from minSelections > 0
		const isRequired = minSelections > 0;

		return await db.transaction(async (tx) => {
			let savedGroup: typeof optionGroups.$inferSelect;

			if (optionGroupId) {
				// Update existing option group
				const [updated] = await tx
					.update(optionGroups)
					.set({
						...groupData,
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
					throw new Error("Option group not found");
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
					await tx.delete(optionChoices).where(eq(optionChoices.id, choiceId));
				}

				// Update existing and create new choices
				for (let i = 0; i < choices.length; i++) {
					const choice = choices[i];
					if (choice.id) {
						// Update existing
						await tx
							.update(optionChoices)
							.set({
								translations: choice.translations,
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
							translations: choice.translations,
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
						...groupData,
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

				savedGroup = created;

				// Create all choices
				for (let i = 0; i < choices.length; i++) {
					const choice = choices[i];
					await tx.insert(optionChoices).values({
						optionGroupId: savedGroup.id,
						translations: choice.translations,
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
				throw new Error("Failed to save option group");
			}
			return result;
		});
	});

// ============================================================================
// OPTION CHOICES
// ============================================================================

export const createOptionChoice = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(createOptionChoiceSchema)
	.handler(async ({ context, data }) => {
		await requireOptionGroupOwnership(
			data.optionGroupId,
			context.auth.merchantId,
		);

		// Get max display order for this option group
		const existing = await db.query.optionChoices.findMany({
			where: eq(optionChoices.optionGroupId, data.optionGroupId),
			orderBy: (choices, { desc }) => [desc(choices.displayOrder)],
			limit: 1,
		});
		const maxOrder = existing[0]?.displayOrder ?? -1;

		const [newChoice] = await db
			.insert(optionChoices)
			.values({
				...data,
				displayOrder: data.displayOrder ?? maxOrder + 1,
			})
			.returning();

		return newChoice;
	});

export const updateOptionChoice = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(
		updateOptionChoiceSchema.extend({ optionChoiceId: z.string().uuid() }),
	)
	.handler(async ({ context, data }) => {
		await requireOptionChoiceOwnership(
			data.optionChoiceId,
			context.auth.merchantId,
		);

		const { optionChoiceId, ...updates } = data;

		const [updatedChoice] = await db
			.update(optionChoices)
			.set(updates)
			.where(eq(optionChoices.id, optionChoiceId))
			.returning();

		if (!updatedChoice) {
			throw new Error("Option choice not found");
		}

		return updatedChoice;
	});

export const toggleOptionChoiceAvailable = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(
		z.object({ optionChoiceId: z.string().uuid(), isAvailable: z.boolean() }),
	)
	.handler(async ({ context, data }) => {
		await requireOptionChoiceOwnership(
			data.optionChoiceId,
			context.auth.merchantId,
		);

		const [updatedChoice] = await db
			.update(optionChoices)
			.set({ isAvailable: data.isAvailable })
			.where(eq(optionChoices.id, data.optionChoiceId))
			.returning();

		if (!updatedChoice) {
			throw new Error("Option choice not found");
		}

		return updatedChoice;
	});

export const deleteOptionChoice = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(z.object({ optionChoiceId: z.string().uuid() }))
	.handler(async ({ context, data }) => {
		await requireOptionChoiceOwnership(
			data.optionChoiceId,
			context.auth.merchantId,
		);

		await db
			.delete(optionChoices)
			.where(eq(optionChoices.id, data.optionChoiceId));
	});

// ============================================================================
// ITEM OPTIONS (Many-to-Many)
// ============================================================================

export const getItemOptions = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.inputValidator(z.object({ itemId: z.string().uuid() }))
	.handler(async ({ context, data }) => {
		await requireItemOwnership(data.itemId, context.auth.merchantId);

		const itemOptions = await db.query.itemOptionGroups.findMany({
			where: eq(itemOptionGroups.itemId, data.itemId),
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
	});

export const updateItemOptions = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(updateItemOptionsSchema)
	.handler(async ({ context, data }) => {
		await requireItemOwnership(data.itemId, context.auth.merchantId);

		const { itemId, optionGroupIds } = data;

		// Delete all existing item option links
		await db
			.delete(itemOptionGroups)
			.where(eq(itemOptionGroups.itemId, itemId));

		// Insert new links with display order
		if (optionGroupIds.length > 0) {
			await db.insert(itemOptionGroups).values(
				optionGroupIds.map((optionGroupId, index) => ({
					itemId,
					optionGroupId,
					displayOrder: index,
				})),
			);
		}

		// Return updated item options
		const updatedOptions = await db.query.itemOptionGroups.findMany({
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
	});
