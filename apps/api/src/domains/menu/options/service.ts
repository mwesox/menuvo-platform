/**
 * Options Service
 *
 * Service facade for option group and choice operations.
 */

import type { Database } from "@menuvo/db";
import {
	itemOptionGroups,
	items,
	optionChoices,
	optionGroups,
	stores,
} from "@menuvo/db/schema";
import { asc, eq } from "drizzle-orm";
import { NotFoundError, ValidationError } from "../../errors.js";
import type { IOptionsService } from "./interface.js";
import {
	type ChoiceTranslations,
	type EntityTranslations,
	type OptionGroupType,
	optionGroupTypeSchema,
	type PublicOptionChoice,
	type PublicOptionGroup,
} from "./schemas.js";

/**
 * Derive selection constraints based on option group type.
 */
function deriveSelectionsFromType(
	type: OptionGroupType,
	inputMin: number,
	inputMax: number | null,
): { minSelections: number; maxSelections: number | null } {
	if (type === "single_select") {
		return { minSelections: 1, maxSelections: 1 };
	}
	return { minSelections: inputMin, maxSelections: inputMax };
}

function parseOptionGroupType(value: string): OptionGroupType {
	const parsed = optionGroupTypeSchema.safeParse(value);
	if (!parsed.success) {
		throw new ValidationError(`Invalid option group type: ${value}`);
	}
	return parsed.data;
}

function toPublicOptionChoice(
	choice: typeof optionChoices.$inferSelect,
): PublicOptionChoice {
	return {
		...choice,
		translations: choice.translations as ChoiceTranslations,
	};
}

function toPublicOptionGroup(
	group: typeof optionGroups.$inferSelect & {
		choices?: Array<typeof optionChoices.$inferSelect>;
	},
): PublicOptionGroup & { choices: PublicOptionChoice[] } {
	return {
		...group,
		type: parseOptionGroupType(group.type),
		choices: group.choices ? group.choices.map(toPublicOptionChoice) : [],
	};
}

/**
 * Options service implementation
 */
export class OptionsService implements IOptionsService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async listGroups(storeId: string, merchantId: string) {
		await this.requireStoreOwnership(storeId, merchantId);

		const groups = await this.db.query.optionGroups.findMany({
			where: eq(optionGroups.storeId, storeId),
			orderBy: [asc(optionGroups.displayOrder)],
			with: {
				choices: {
					orderBy: (choices, { asc }) => [asc(choices.displayOrder)],
				},
			},
		});

		return groups.map((group) => toPublicOptionGroup(group));
	}

	async getGroup(optionGroupId: string, merchantId: string) {
		await this.requireOptionGroupOwnership(optionGroupId, merchantId);

		const optionGroup = await this.db.query.optionGroups.findFirst({
			where: eq(optionGroups.id, optionGroupId),
			with: {
				choices: {
					orderBy: (choices, { asc }) => [asc(choices.displayOrder)],
				},
				optGroups: true,
			},
		});

		if (!optionGroup) {
			throw new NotFoundError("Option group not found");
		}

		const { optGroups, ...group } = optionGroup;

		return {
			...toPublicOptionGroup(group),
			itemCount: optGroups.length,
		};
	}

	async createGroup(
		storeId: string,
		merchantId: string,
		input: {
			translations: EntityTranslations;
			type: "single_select" | "multi_select" | "quantity_select";
			minSelections: number;
			maxSelections: number | null;
			isRequired: boolean;
			numFreeOptions: number;
			aggregateMinQuantity: number | null;
			aggregateMaxQuantity: number | null;
			displayOrder?: number;
		},
	): Promise<typeof optionGroups.$inferSelect> {
		await this.requireStoreOwnership(storeId, merchantId);

		// Get max display order
		const existing = await this.db.query.optionGroups.findMany({
			where: eq(optionGroups.storeId, storeId),
			orderBy: (optionGroups, { desc }) => [desc(optionGroups.displayOrder)],
			limit: 1,
		});
		const maxOrder = existing[0]?.displayOrder ?? -1;

		const [newOptionGroup] = await this.db
			.insert(optionGroups)
			.values({
				storeId,
				translations: input.translations,
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

		if (!newOptionGroup) {
			throw new ValidationError("Failed to create option group");
		}

		return newOptionGroup;
	}

	async updateGroup(
		optionGroupId: string,
		merchantId: string,
		input: {
			translations?: EntityTranslations;
			type?: "single_select" | "multi_select" | "quantity_select";
			minSelections?: number;
			maxSelections?: number | null;
			isRequired?: boolean;
			numFreeOptions?: number;
			aggregateMinQuantity?: number | null;
			aggregateMaxQuantity?: number | null;
		},
	): Promise<typeof optionGroups.$inferSelect> {
		await this.requireOptionGroupOwnership(optionGroupId, merchantId);

		const [updatedOptionGroup] = await this.db
			.update(optionGroups)
			.set({
				...input,
				...(input.translations && {
					translations: input.translations,
				}),
			})
			.where(eq(optionGroups.id, optionGroupId))
			.returning();

		if (!updatedOptionGroup) {
			throw new NotFoundError("Option group not found");
		}

		return updatedOptionGroup;
	}

	async toggleGroupActive(
		optionGroupId: string,
		merchantId: string,
		isActive: boolean,
	): Promise<typeof optionGroups.$inferSelect> {
		await this.requireOptionGroupOwnership(optionGroupId, merchantId);

		const [updatedOptionGroup] = await this.db
			.update(optionGroups)
			.set({ isActive })
			.where(eq(optionGroups.id, optionGroupId))
			.returning();

		if (!updatedOptionGroup) {
			throw new NotFoundError("Option group not found");
		}

		return updatedOptionGroup;
	}

	async deleteGroup(optionGroupId: string, merchantId: string): Promise<void> {
		await this.requireOptionGroupOwnership(optionGroupId, merchantId);

		await this.db
			.delete(optionGroups)
			.where(eq(optionGroups.id, optionGroupId));
	}

	async saveGroupWithChoices(input: {
		optionGroupId?: string;
		storeId: string;
		merchantId: string;
		choices: Array<{
			id?: string;
			translations: ChoiceTranslations;
			priceModifier: number;
			isDefault?: boolean;
			minQuantity?: number;
			maxQuantity?: number | null;
		}>;
		type?: "single_select" | "multi_select" | "quantity_select";
		minSelections?: number;
		maxSelections?: number | null;
		numFreeOptions?: number;
		aggregateMinQuantity?: number | null;
		aggregateMaxQuantity?: number | null;
		translations: EntityTranslations;
	}) {
		await this.requireStoreOwnership(input.storeId, input.merchantId);

		if (input.optionGroupId) {
			await this.requireOptionGroupOwnership(
				input.optionGroupId,
				input.merchantId,
			);
		}

		const type = input.type ?? "multi_select";
		const { minSelections, maxSelections } = deriveSelectionsFromType(
			type,
			input.minSelections ?? 0,
			input.maxSelections ?? null,
		);
		const isRequired = minSelections > 0;

		return this.db.transaction(async (tx) => {
			let savedGroup: typeof optionGroups.$inferSelect;

			if (input.optionGroupId) {
				// Update existing
				const [updated] = await tx
					.update(optionGroups)
					.set({
						translations: input.translations,
						type,
						minSelections,
						maxSelections,
						isRequired,
						numFreeOptions: input.numFreeOptions ?? 0,
						aggregateMinQuantity: input.aggregateMinQuantity,
						aggregateMaxQuantity: input.aggregateMaxQuantity,
					})
					.where(eq(optionGroups.id, input.optionGroupId))
					.returning();

				if (!updated) {
					throw new NotFoundError("Option group not found");
				}
				savedGroup = updated;

				// Diff choices
				const existingChoices = await tx.query.optionChoices.findMany({
					where: eq(optionChoices.optionGroupId, input.optionGroupId),
				});
				const existingIds = new Set(existingChoices.map((c) => c.id));
				const newIds = new Set(
					input.choices
						.filter((c): c is typeof c & { id: string } => c.id !== undefined)
						.map((c) => c.id),
				);

				// Delete removed
				const toDelete = [...existingIds].filter((id) => !newIds.has(id));
				for (const choiceId of toDelete) {
					await tx.delete(optionChoices).where(eq(optionChoices.id, choiceId));
				}

				// Update/create choices
				for (const [i, choice] of input.choices.entries()) {
					if (choice.id) {
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
						await tx.insert(optionChoices).values({
							optionGroupId: input.optionGroupId,
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
				// Create new
				const existing = await tx.query.optionGroups.findMany({
					where: eq(optionGroups.storeId, input.storeId),
					orderBy: (og, { desc }) => [desc(og.displayOrder)],
					limit: 1,
				});
				const maxOrder = existing[0]?.displayOrder ?? -1;

				const [created] = await tx
					.insert(optionGroups)
					.values({
						storeId: input.storeId,
						translations: input.translations,
						type,
						minSelections,
						maxSelections,
						isRequired,
						numFreeOptions: input.numFreeOptions ?? 0,
						aggregateMinQuantity: input.aggregateMinQuantity,
						aggregateMaxQuantity: input.aggregateMaxQuantity,
						displayOrder: maxOrder + 1,
					})
					.returning();

				if (!created) {
					throw new ValidationError("Failed to create option group");
				}
				savedGroup = created;

				// Create choices
				for (const [i, choice] of input.choices.entries()) {
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

			// Return with choices
			const result = await tx.query.optionGroups.findFirst({
				where: eq(optionGroups.id, savedGroup.id),
				with: {
					choices: {
						orderBy: (c, { asc }) => [asc(c.displayOrder)],
					},
				},
			});

			if (!result) {
				throw new ValidationError("Failed to save option group");
			}
			return toPublicOptionGroup(result);
		});
	}

	async listChoices(optionGroupId: string, merchantId: string) {
		await this.requireOptionGroupOwnership(optionGroupId, merchantId);

		return this.db.query.optionChoices.findMany({
			where: eq(optionChoices.optionGroupId, optionGroupId),
			orderBy: [asc(optionChoices.displayOrder)],
		});
	}

	async createChoice(
		optionGroupId: string,
		merchantId: string,
		input: {
			translations: ChoiceTranslations;
			priceModifier: number;
			isDefault: boolean;
			minQuantity: number;
			maxQuantity: number | null;
			displayOrder?: number;
		},
	): Promise<typeof optionChoices.$inferSelect> {
		await this.requireOptionGroupOwnership(optionGroupId, merchantId);

		// Get max display order
		const existing = await this.db.query.optionChoices.findMany({
			where: eq(optionChoices.optionGroupId, optionGroupId),
			orderBy: (choices, { desc }) => [desc(choices.displayOrder)],
			limit: 1,
		});
		const maxOrder = existing[0]?.displayOrder ?? -1;

		const [newChoice] = await this.db
			.insert(optionChoices)
			.values({
				optionGroupId,
				translations: input.translations,
				priceModifier: input.priceModifier,
				isDefault: input.isDefault,
				minQuantity: input.minQuantity,
				maxQuantity: input.maxQuantity,
				displayOrder: input.displayOrder ?? maxOrder + 1,
			})
			.returning();

		if (!newChoice) {
			throw new ValidationError("Failed to create option choice");
		}

		return newChoice;
	}

	async updateChoice(
		optionChoiceId: string,
		merchantId: string,
		input: {
			translations?: ChoiceTranslations;
			priceModifier?: number;
			isDefault?: boolean;
			minQuantity?: number;
			maxQuantity?: number | null;
		},
	): Promise<typeof optionChoices.$inferSelect> {
		await this.requireOptionChoiceOwnership(optionChoiceId, merchantId);

		const [updatedChoice] = await this.db
			.update(optionChoices)
			.set({
				...input,
				...(input.translations && {
					translations: input.translations,
				}),
			})
			.where(eq(optionChoices.id, optionChoiceId))
			.returning();

		if (!updatedChoice) {
			throw new NotFoundError("Option choice not found");
		}

		return updatedChoice;
	}

	async toggleChoiceAvailable(
		optionChoiceId: string,
		merchantId: string,
		isAvailable: boolean,
	): Promise<typeof optionChoices.$inferSelect> {
		await this.requireOptionChoiceOwnership(optionChoiceId, merchantId);

		const [updatedChoice] = await this.db
			.update(optionChoices)
			.set({ isAvailable })
			.where(eq(optionChoices.id, optionChoiceId))
			.returning();

		if (!updatedChoice) {
			throw new NotFoundError("Option choice not found");
		}

		return updatedChoice;
	}

	async deleteChoice(
		optionChoiceId: string,
		merchantId: string,
	): Promise<void> {
		await this.requireOptionChoiceOwnership(optionChoiceId, merchantId);

		await this.db
			.delete(optionChoices)
			.where(eq(optionChoices.id, optionChoiceId));
	}

	async getItemOptions(itemId: string, merchantId: string) {
		await this.requireItemOwnership(itemId, merchantId);

		const itemOptions = await this.db.query.itemOptionGroups.findMany({
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

		return itemOptions.map((io) => toPublicOptionGroup(io.optGroup));
	}

	async updateItemOptions(
		itemId: string,
		merchantId: string,
		optionGroupIds: string[],
	) {
		await this.requireItemOwnership(itemId, merchantId);

		// Delete existing links
		await this.db
			.delete(itemOptionGroups)
			.where(eq(itemOptionGroups.itemId, itemId));

		// Insert new links
		if (optionGroupIds.length > 0) {
			await this.db.insert(itemOptionGroups).values(
				optionGroupIds.map((optionGroupId, index) => ({
					itemId,
					optionGroupId,
					displayOrder: index,
				})),
			);
		}

		// Return updated options
		const updatedOptions = await this.db.query.itemOptionGroups.findMany({
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

		return updatedOptions.map((io) => toPublicOptionGroup(io.optGroup));
	}

	// Helper methods
	private async requireStoreOwnership(storeId: string, merchantId: string) {
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.id, storeId),
			columns: { id: true, merchantId: true },
		});
		if (!store || store.merchantId !== merchantId) {
			throw new NotFoundError("Store not found or access denied");
		}
		return store;
	}

	private async requireOptionGroupOwnership(
		optionGroupId: string,
		merchantId: string,
	) {
		const optionGroup = await this.db.query.optionGroups.findFirst({
			where: eq(optionGroups.id, optionGroupId),
			with: { store: { columns: { merchantId: true } } },
		});
		if (!optionGroup || optionGroup.store.merchantId !== merchantId) {
			throw new NotFoundError("Option group not found or access denied");
		}
		return optionGroup;
	}

	private async requireOptionChoiceOwnership(
		optionChoiceId: string,
		merchantId: string,
	) {
		const optionChoice = await this.db.query.optionChoices.findFirst({
			where: eq(optionChoices.id, optionChoiceId),
			with: {
				optGroup: {
					with: { store: { columns: { merchantId: true } } },
				},
			},
		});
		if (
			!optionChoice ||
			optionChoice.optGroup.store.merchantId !== merchantId
		) {
			throw new NotFoundError("Option choice not found or access denied");
		}
		return optionChoice;
	}

	private async requireItemOwnership(itemId: string, merchantId: string) {
		const item = await this.db.query.items.findFirst({
			where: eq(items.id, itemId),
			with: { store: { columns: { merchantId: true } } },
		});
		if (!item || item.store.merchantId !== merchantId) {
			throw new NotFoundError("Item not found or access denied");
		}
		return item;
	}
}
