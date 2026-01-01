import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { itemOptionGroups, optionChoices, optionGroups } from "@/db/schema";
import {
	createOptionChoiceSchema,
	createOptionGroupSchema,
	updateItemOptionsSchema,
	updateOptionChoiceSchema,
	updateOptionGroupSchema,
} from "../options.validation";

// ============================================================================
// OPTION GROUPS
// ============================================================================

export const getOptionGroups = createServerFn({ method: "GET" })
	.inputValidator(z.object({ storeId: z.number() }))
	.handler(async ({ data }) => {
		const allOptionGroups = await db.query.optionGroups.findMany({
			where: eq(optionGroups.storeId, data.storeId),
			orderBy: [asc(optionGroups.displayOrder), asc(optionGroups.name)],
			with: {
				optionChoices: {
					orderBy: (choices, { asc }) => [asc(choices.displayOrder)],
				},
			},
		});
		return allOptionGroups;
	});

export const getOptionGroup = createServerFn({ method: "GET" })
	.inputValidator(z.object({ optionGroupId: z.number() }))
	.handler(async ({ data }) => {
		const optionGroup = await db.query.optionGroups.findFirst({
			where: eq(optionGroups.id, data.optionGroupId),
			with: {
				optionChoices: {
					orderBy: (choices, { asc }) => [asc(choices.displayOrder)],
				},
				itemOptionGroups: true,
			},
		});

		if (!optionGroup) {
			throw new Error("Option group not found");
		}

		// Return with item count
		return {
			...optionGroup,
			itemCount: optionGroup.itemOptionGroups.length,
		};
	});

export const createOptionGroup = createServerFn({ method: "POST" })
	.inputValidator(createOptionGroupSchema)
	.handler(async ({ data }) => {
		// Get max display order
		const existing = await db.query.optionGroups.findMany({
			where: eq(optionGroups.storeId, data.storeId),
			orderBy: (optionGroups, { desc }) => [desc(optionGroups.displayOrder)],
			limit: 1,
		});
		const maxOrder = existing[0]?.displayOrder ?? -1;

		const [newOptionGroup] = await db
			.insert(optionGroups)
			.values({
				...data,
				displayOrder: data.displayOrder ?? maxOrder + 1,
			})
			.returning();

		return newOptionGroup;
	});

export const updateOptionGroup = createServerFn({ method: "POST" })
	.inputValidator(updateOptionGroupSchema.extend({ optionGroupId: z.number() }))
	.handler(async ({ data }) => {
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
	.inputValidator(
		z.object({ optionGroupId: z.number(), isActive: z.boolean() }),
	)
	.handler(async ({ data }) => {
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
	.inputValidator(z.object({ optionGroupId: z.number() }))
	.handler(async ({ data }) => {
		// Cascade deletes are handled by database constraints
		// (choices and item links will be deleted automatically)
		await db
			.delete(optionGroups)
			.where(eq(optionGroups.id, data.optionGroupId));
		return { success: true };
	});

// ============================================================================
// OPTION CHOICES
// ============================================================================

export const createOptionChoice = createServerFn({ method: "POST" })
	.inputValidator(createOptionChoiceSchema)
	.handler(async ({ data }) => {
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
	.inputValidator(
		updateOptionChoiceSchema.extend({ optionChoiceId: z.number() }),
	)
	.handler(async ({ data }) => {
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
	.inputValidator(
		z.object({ optionChoiceId: z.number(), isAvailable: z.boolean() }),
	)
	.handler(async ({ data }) => {
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
	.inputValidator(z.object({ optionChoiceId: z.number() }))
	.handler(async ({ data }) => {
		await db
			.delete(optionChoices)
			.where(eq(optionChoices.id, data.optionChoiceId));
	});

// ============================================================================
// ITEM OPTIONS (Many-to-Many)
// ============================================================================

export const getItemOptions = createServerFn({ method: "GET" })
	.inputValidator(z.object({ itemId: z.number() }))
	.handler(async ({ data }) => {
		const itemOptions = await db.query.itemOptionGroups.findMany({
			where: eq(itemOptionGroups.itemId, data.itemId),
			orderBy: [asc(itemOptionGroups.displayOrder)],
			with: {
				optionGroup: {
					with: {
						optionChoices: {
							orderBy: (choices, { asc }) => [asc(choices.displayOrder)],
						},
					},
				},
			},
		});

		// Return the option groups with their choices
		return itemOptions.map((io) => io.optionGroup);
	});

export const updateItemOptions = createServerFn({ method: "POST" })
	.inputValidator(updateItemOptionsSchema)
	.handler(async ({ data }) => {
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
				optionGroup: {
					with: {
						optionChoices: {
							orderBy: (choices, { asc }) => [asc(choices.displayOrder)],
						},
					},
				},
			},
		});

		return updatedOptions.map((io) => io.optionGroup);
	});
