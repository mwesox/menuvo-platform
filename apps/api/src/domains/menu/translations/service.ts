/**
 * Translations Service
 *
 * Service facade for translation operations.
 */

import type { Database } from "@menuvo/db";
import {
	categories,
	items,
	optionChoices,
	optionGroups,
	stores,
} from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../../errors.js";
import type { ITranslationsService } from "./interface.js";
import type {
	ChoiceTranslations,
	EntityTranslations,
	TranslationStatus,
} from "./types.js";

/**
 * Translations service implementation
 */
export class TranslationsService implements ITranslationsService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getStatus(storeId: string, merchantId: string) {
		const store = await this.getStoreWithMerchant(storeId, merchantId);
		if (!store) {
			throw new NotFoundError("Store not found or access denied");
		}

		const supportedLanguages = store.merchant.supportedLanguages ?? [];

		// Get all entities
		const allCategories = await this.db.query.categories.findMany({
			where: eq(categories.storeId, storeId),
			orderBy: (c, { asc }) => [asc(c.displayOrder)],
		});

		const allItems = await this.db.query.items.findMany({
			where: eq(items.storeId, storeId),
			orderBy: (i, { asc }) => [asc(i.displayOrder)],
		});

		const allOptionGroups = await this.db.query.optionGroups.findMany({
			where: eq(optionGroups.storeId, storeId),
			with: {
				choices: {
					orderBy: (c, { asc }) => [asc(c.displayOrder)],
				},
			},
			orderBy: (og, { asc }) => [asc(og.displayOrder)],
		});

		const hasDescription = (translations: EntityTranslations | null) =>
			Object.values(translations ?? {}).some((t) => t?.description);

		return {
			fallbackLanguage: supportedLanguages[0] ?? "de",
			supportedLanguages,
			categories: allCategories.map((cat) => {
				const statusInfo = this.calculateStatus(
					cat.translations,
					supportedLanguages,
					hasDescription(cat.translations),
				);
				return {
					...cat,
					translationStatus: statusInfo.status,
					translationStatusByLanguage: statusInfo.byLanguage,
				};
			}),
			items: allItems.map((item) => {
				const statusInfo = this.calculateStatus(
					item.translations,
					supportedLanguages,
					hasDescription(item.translations),
				);
				return {
					...item,
					translationStatus: statusInfo.status,
					translationStatusByLanguage: statusInfo.byLanguage,
				};
			}),
			optionGroups: allOptionGroups.map((og) => {
				const statusInfo = this.calculateStatus(
					og.translations,
					supportedLanguages,
					hasDescription(og.translations),
				);
				return {
					...og,
					translationStatus: statusInfo.status,
					translationStatusByLanguage: statusInfo.byLanguage,
					choices: og.choices.map((choice) => {
						const choiceStatusInfo = this.calculateStatus(
							choice.translations,
							supportedLanguages,
							false,
						);
						return {
							...choice,
							translationStatus: choiceStatusInfo.status,
							translationStatusByLanguage: choiceStatusInfo.byLanguage,
						};
					}),
				};
			}),
		};
	}

	async getMissingReport(
		storeId: string,
		merchantId: string,
		languageCode?: string,
	) {
		const store = await this.getStoreWithMerchant(storeId, merchantId);
		if (!store) {
			throw new NotFoundError("Store not found or access denied");
		}

		const supportedLanguages = store.merchant.supportedLanguages ?? [];
		const targetLanguages = languageCode ? [languageCode] : supportedLanguages;

		const fallbackLang = supportedLanguages[0] ?? "de";
		const getDisplayName = (
			translations: EntityTranslations | ChoiceTranslations | null,
		): string => {
			if (!translations) return "(unnamed)";
			return (
				(translations[fallbackLang] as { name?: string })?.name ??
				Object.values(translations).find((t) => t?.name)?.name ??
				"(unnamed)"
			);
		};

		// Get all entities
		const allCategories = await this.db.query.categories.findMany({
			where: eq(categories.storeId, storeId),
		});
		const allItems = await this.db.query.items.findMany({
			where: eq(items.storeId, storeId),
		});
		const allOptionGroups = await this.db.query.optionGroups.findMany({
			where: eq(optionGroups.storeId, storeId),
			with: { choices: true },
		});

		const missing = {
			categories: [] as {
				id: string;
				name: string;
				missingLanguages: string[];
			}[],
			items: [] as { id: string; name: string; missingLanguages: string[] }[],
			optionGroups: [] as {
				id: string;
				name: string;
				missingLanguages: string[];
			}[],
			optionChoices: [] as {
				id: string;
				name: string;
				optionGroupId: string;
				missingLanguages: string[];
			}[],
		};

		for (const cat of allCategories) {
			const trans = (cat.translations ?? {}) as EntityTranslations;
			const missingLangs = targetLanguages.filter((l) => !trans[l]?.name);
			if (missingLangs.length > 0) {
				missing.categories.push({
					id: cat.id,
					name: getDisplayName(trans),
					missingLanguages: missingLangs,
				});
			}
		}

		for (const item of allItems) {
			const trans = (item.translations ?? {}) as EntityTranslations;
			const missingLangs = targetLanguages.filter((l) => !trans[l]?.name);
			if (missingLangs.length > 0) {
				missing.items.push({
					id: item.id,
					name: getDisplayName(trans),
					missingLanguages: missingLangs,
				});
			}
		}

		for (const og of allOptionGroups) {
			const trans = (og.translations ?? {}) as EntityTranslations;
			const missingLangs = targetLanguages.filter((l) => !trans[l]?.name);
			if (missingLangs.length > 0) {
				missing.optionGroups.push({
					id: og.id,
					name: getDisplayName(trans),
					missingLanguages: missingLangs,
				});
			}

			for (const choice of og.choices) {
				const choiceTrans = (choice.translations ?? {}) as ChoiceTranslations;
				const choiceMissingLangs = targetLanguages.filter(
					(l) => !choiceTrans[l]?.name,
				);
				if (choiceMissingLangs.length > 0) {
					missing.optionChoices.push({
						id: choice.id,
						name: getDisplayName(choiceTrans),
						optionGroupId: og.id,
						missingLanguages: choiceMissingLangs,
					});
				}
			}
		}

		const totalItems =
			allCategories.length +
			allItems.length +
			allOptionGroups.length +
			allOptionGroups.reduce((sum, og) => sum + og.choices.length, 0);
		const missingCount =
			missing.categories.length +
			missing.items.length +
			missing.optionGroups.length +
			missing.optionChoices.length;

		return {
			summary: {
				totalItems,
				missingCount,
				completeCount: totalItems - missingCount,
				completionPercentage:
					totalItems > 0
						? Math.round(((totalItems - missingCount) / totalItems) * 100)
						: 100,
			},
			missing,
		};
	}

	async updateCategory(
		categoryId: string,
		merchantId: string,
		languageCode: string,
		name: string,
		description?: string,
	): Promise<typeof categories.$inferSelect> {
		const existing = await this.getCategoryWithOwnership(
			categoryId,
			merchantId,
		);
		if (!existing) {
			throw new NotFoundError("Category not found or access denied");
		}

		const existingTranslations = (existing.translations ??
			{}) as EntityTranslations;

		const mergedTranslations: EntityTranslations = {
			...existingTranslations,
			[languageCode]: {
				name,
				description,
			},
		};

		const [updated] = await this.db
			.update(categories)
			.set({ translations: mergedTranslations })
			.where(eq(categories.id, categoryId))
			.returning();

		if (!updated) {
			throw new NotFoundError("Failed to update category translations");
		}

		return updated;
	}

	async updateItem(
		itemId: string,
		merchantId: string,
		languageCode: string,
		name: string,
		description?: string,
	): Promise<typeof items.$inferSelect> {
		const existing = await this.getItemWithOwnership(itemId, merchantId);
		if (!existing) {
			throw new NotFoundError("Item not found or access denied");
		}

		const existingTranslations = (existing.translations ??
			{}) as EntityTranslations;

		const mergedTranslations: EntityTranslations = {
			...existingTranslations,
			[languageCode]: {
				name,
				description,
			},
		};

		const [updated] = await this.db
			.update(items)
			.set({ translations: mergedTranslations })
			.where(eq(items.id, itemId))
			.returning();

		if (!updated) {
			throw new NotFoundError("Failed to update item translations");
		}

		return updated;
	}

	async updateOptionGroup(
		optionGroupId: string,
		merchantId: string,
		languageCode: string,
		name: string,
	): Promise<typeof optionGroups.$inferSelect> {
		const existing = await this.getOptionGroupWithOwnership(
			optionGroupId,
			merchantId,
		);
		if (!existing) {
			throw new NotFoundError("Option group not found or access denied");
		}

		const existingTranslations = (existing.translations ??
			{}) as EntityTranslations;

		const mergedTranslations: EntityTranslations = {
			...existingTranslations,
			[languageCode]: {
				name,
			},
		};

		const [updated] = await this.db
			.update(optionGroups)
			.set({ translations: mergedTranslations })
			.where(eq(optionGroups.id, optionGroupId))
			.returning();

		if (!updated) {
			throw new NotFoundError("Failed to update option group translations");
		}

		return updated;
	}

	async updateOptionChoice(
		optionChoiceId: string,
		merchantId: string,
		languageCode: string,
		name: string,
	): Promise<typeof optionChoices.$inferSelect> {
		const existing = await this.getOptionChoiceWithOwnership(
			optionChoiceId,
			merchantId,
		);
		if (!existing) {
			throw new NotFoundError("Option choice not found or access denied");
		}

		const existingTranslations = (existing.translations ??
			{}) as ChoiceTranslations;

		const mergedTranslations: ChoiceTranslations = {
			...existingTranslations,
			[languageCode]: {
				name,
			},
		};

		const [updated] = await this.db
			.update(optionChoices)
			.set({ translations: mergedTranslations })
			.where(eq(optionChoices.id, optionChoiceId))
			.returning();

		if (!updated) {
			throw new NotFoundError("Failed to update option choice translations");
		}

		return updated;
	}

	// Helper methods
	private calculateStatus(
		translations: EntityTranslations | ChoiceTranslations | null,
		targetLanguages: string[],
		hasDescription: boolean,
	): {
		status: TranslationStatus;
		byLanguage: Record<string, TranslationStatus>;
	} {
		const trans = translations ?? {};
		const byLanguage: Record<string, TranslationStatus> = {};

		let allComplete = true;
		let anyComplete = false;

		for (const lang of targetLanguages) {
			const langTrans = trans[lang] as
				| { name?: string; description?: string }
				| undefined;

			if (!langTrans?.name) {
				byLanguage[lang] = "missing";
				allComplete = false;
			} else if (hasDescription && !langTrans.description) {
				byLanguage[lang] = "partial";
				allComplete = false;
				anyComplete = true;
			} else {
				byLanguage[lang] = "complete";
				anyComplete = true;
			}
		}

		let status: TranslationStatus = "missing";
		if (allComplete && targetLanguages.length > 0) {
			status = "complete";
		} else if (anyComplete) {
			status = "partial";
		}

		return { status, byLanguage };
	}

	private async getStoreWithMerchant(storeId: string, merchantId: string) {
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.id, storeId),
			with: {
				merchant: {
					columns: { supportedLanguages: true },
				},
			},
		});
		if (!store || store.merchantId !== merchantId) {
			return null;
		}
		return store;
	}

	private async getCategoryWithOwnership(
		categoryId: string,
		merchantId: string,
	) {
		const category = await this.db.query.categories.findFirst({
			where: eq(categories.id, categoryId),
			with: { store: { columns: { merchantId: true } } },
		});
		if (!category || category.store.merchantId !== merchantId) {
			return null;
		}
		return category;
	}

	private async getItemWithOwnership(itemId: string, merchantId: string) {
		const item = await this.db.query.items.findFirst({
			where: eq(items.id, itemId),
			with: { store: { columns: { merchantId: true } } },
		});
		if (!item || item.store.merchantId !== merchantId) {
			return null;
		}
		return item;
	}

	private async getOptionGroupWithOwnership(
		optionGroupId: string,
		merchantId: string,
	) {
		const og = await this.db.query.optionGroups.findFirst({
			where: eq(optionGroups.id, optionGroupId),
			with: { store: { columns: { merchantId: true } } },
		});
		if (!og || og.store.merchantId !== merchantId) {
			return null;
		}
		return og;
	}

	private async getOptionChoiceWithOwnership(
		optionChoiceId: string,
		merchantId: string,
	) {
		const choice = await this.db.query.optionChoices.findFirst({
			where: eq(optionChoices.id, optionChoiceId),
			with: {
				optGroup: {
					with: { store: { columns: { merchantId: true } } },
				},
			},
		});
		if (!choice || choice.optGroup.store.merchantId !== merchantId) {
			return null;
		}
		return choice;
	}
}
