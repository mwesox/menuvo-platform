import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
	type ChoiceTranslations,
	categories,
	type EntityTranslations,
	items,
	merchants,
	optionChoices,
	optionGroups,
} from "@/db/schema.ts";
import {
	languageCodeSchema,
	type TranslationStatus,
	updateCategoryTranslationsSchema,
	updateItemTranslationsSchema,
	updateOptionChoiceTranslationsSchema,
	updateOptionGroupTranslationsSchema,
	updateSupportedLanguagesSchema,
} from "../validation.ts";

// ============================================================================
// MERCHANT LANGUAGE CONFIGURATION
// ============================================================================

/**
 * Update merchant's supported languages.
 * All languages are equal - first in array is used as fallback when needed.
 */
export const updateMerchantLanguages = createServerFn({ method: "POST" })
	.inputValidator(updateSupportedLanguagesSchema)
	.handler(async ({ data }) => {
		const { merchantId, supportedLanguages } = data;

		const [updated] = await db
			.update(merchants)
			.set({ supportedLanguages })
			.where(eq(merchants.id, merchantId))
			.returning();

		if (!updated) {
			throw new Error("Merchant not found");
		}

		return updated;
	});

// ============================================================================
// TRANSLATION STATUS QUERIES
// ============================================================================

/**
 * Calculate translation status for an entity.
 */
function calculateStatus(
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

/**
 * Get all translatable entities for a store with their translation status.
 * Now checks ALL supported languages equally (no special treatment for default).
 */
export const getTranslationStatus = createServerFn({ method: "GET" })
	.inputValidator(z.object({ storeId: z.number(), merchantId: z.number() }))
	.handler(async ({ data }) => {
		const { storeId, merchantId } = data;

		// Get merchant to know supported languages
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
		});

		if (!merchant) {
			throw new Error("Merchant not found");
		}

		// All supported languages need translations (no special treatment for default)
		const supportedLanguages = merchant.supportedLanguages ?? [];

		// Get all categories
		const allCategories = await db.query.categories.findMany({
			where: eq(categories.storeId, storeId),
			orderBy: (c, { asc }) => [asc(c.displayOrder)],
		});

		// Get all items
		const allItems = await db.query.items.findMany({
			where: eq(items.storeId, storeId),
			orderBy: (i, { asc }) => [asc(i.displayOrder)],
		});

		// Get all option groups with choices
		const allOptionGroups = await db.query.optionGroups.findMany({
			where: eq(optionGroups.storeId, storeId),
			with: {
				optionChoices: {
					orderBy: (c, { asc }) => [asc(c.displayOrder)],
				},
			},
			orderBy: (og, { asc }) => [asc(og.displayOrder)],
		});

		// Helper to check if entity has description in any translation
		const hasDescription = (translations: EntityTranslations | null) =>
			Object.values(translations ?? {}).some((t) => t?.description);

		return {
			// First language is used as fallback
			fallbackLanguage: supportedLanguages[0] ?? "de",
			supportedLanguages,
			categories: allCategories.map((cat) => {
				const statusInfo = calculateStatus(
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
				const statusInfo = calculateStatus(
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
				const statusInfo = calculateStatus(
					og.translations,
					supportedLanguages,
					hasDescription(og.translations),
				);
				return {
					...og,
					translationStatus: statusInfo.status,
					translationStatusByLanguage: statusInfo.byLanguage,
					optionChoices: og.optionChoices.map((choice) => {
						const choiceStatusInfo = calculateStatus(
							choice.translations,
							supportedLanguages,
							false, // choices only have name
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
	});

/**
 * Get summary of missing translations.
 * Now checks ALL supported languages equally.
 */
export const getMissingTranslationsReport = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			storeId: z.number(),
			merchantId: z.number(),
			languageCode: languageCodeSchema.optional(),
		}),
	)
	.handler(async ({ data }) => {
		const { storeId, merchantId, languageCode } = data;

		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
		});

		if (!merchant) {
			throw new Error("Merchant not found");
		}

		// All supported languages are checked (no special treatment for default)
		const targetLanguages = languageCode
			? [languageCode]
			: (merchant.supportedLanguages ?? []);

		// Helper to get display name from translations
		// First language in supportedLanguages is used as fallback
		const fallbackLang = merchant.supportedLanguages[0] ?? "de";
		const getDisplayName = (
			translations: EntityTranslations | ChoiceTranslations | null,
		): string => {
			if (!translations) return "(unnamed)";
			// Try fallback language first, then first available
			return (
				(translations[fallbackLang] as { name?: string })?.name ??
				Object.values(translations).find((t) => t?.name)?.name ??
				"(unnamed)"
			);
		};

		// Get all entities
		const allCategories = await db.query.categories.findMany({
			where: eq(categories.storeId, storeId),
		});
		const allItems = await db.query.items.findMany({
			where: eq(items.storeId, storeId),
		});
		const allOptionGroups = await db.query.optionGroups.findMany({
			where: eq(optionGroups.storeId, storeId),
			with: { optionChoices: true },
		});

		// Count missing translations
		const missing = {
			categories: [] as {
				id: number;
				name: string;
				missingLanguages: string[];
			}[],
			items: [] as { id: number; name: string; missingLanguages: string[] }[],
			optionGroups: [] as {
				id: number;
				name: string;
				missingLanguages: string[];
			}[],
			optionChoices: [] as {
				id: number;
				name: string;
				optionGroupId: number;
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

			for (const choice of og.optionChoices) {
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

		// Calculate totals
		const totalChoices = allOptionGroups.reduce(
			(sum, og) => sum + og.optionChoices.length,
			0,
		);
		const totalItems =
			allCategories.length +
			allItems.length +
			allOptionGroups.length +
			totalChoices;

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
	});

// ============================================================================
// TRANSLATION UPDATES
// ============================================================================

/**
 * Filter out undefined/empty entries from translations object.
 */
function cleanTranslations<
	T extends Record<string, { name?: string; description?: string } | undefined>,
>(translations: T): Record<string, { name?: string; description?: string }> {
	const cleaned: Record<string, { name?: string; description?: string }> = {};
	for (const [lang, trans] of Object.entries(translations)) {
		if (trans && (trans.name || trans.description)) {
			cleaned[lang] = trans;
		}
	}
	return cleaned;
}

/**
 * Filter out undefined/empty entries from choice translations (name only).
 */
function cleanChoiceTranslations<
	T extends Record<string, { name?: string } | undefined>,
>(translations: T): Record<string, { name?: string }> {
	const cleaned: Record<string, { name?: string }> = {};
	for (const [lang, trans] of Object.entries(translations)) {
		if (trans?.name) {
			cleaned[lang] = trans;
		}
	}
	return cleaned;
}

/**
 * Update translations for a category.
 */
export const updateCategoryTranslations = createServerFn({ method: "POST" })
	.inputValidator(updateCategoryTranslationsSchema)
	.handler(async ({ data }) => {
		const { categoryId, translations } = data;

		const existing = await db.query.categories.findFirst({
			where: eq(categories.id, categoryId),
		});

		if (!existing) {
			throw new Error("Category not found");
		}

		const existingTranslations = (existing.translations ??
			{}) as EntityTranslations;
		const cleanedNew = cleanTranslations(translations);
		const mergedTranslations = { ...existingTranslations, ...cleanedNew };

		const [updated] = await db
			.update(categories)
			.set({ translations: mergedTranslations })
			.where(eq(categories.id, categoryId))
			.returning();

		return updated;
	});

/**
 * Update translations for an item.
 */
export const updateItemTranslations = createServerFn({ method: "POST" })
	.inputValidator(updateItemTranslationsSchema)
	.handler(async ({ data }) => {
		const { itemId, translations } = data;

		const existing = await db.query.items.findFirst({
			where: eq(items.id, itemId),
		});

		if (!existing) {
			throw new Error("Item not found");
		}

		const existingTranslations = (existing.translations ??
			{}) as EntityTranslations;
		const cleanedNew = cleanTranslations(translations);
		const mergedTranslations = { ...existingTranslations, ...cleanedNew };

		const [updated] = await db
			.update(items)
			.set({ translations: mergedTranslations })
			.where(eq(items.id, itemId))
			.returning();

		return updated;
	});

/**
 * Update translations for an option group.
 */
export const updateOptionGroupTranslations = createServerFn({ method: "POST" })
	.inputValidator(updateOptionGroupTranslationsSchema)
	.handler(async ({ data }) => {
		const { optionGroupId, translations } = data;

		const existing = await db.query.optionGroups.findFirst({
			where: eq(optionGroups.id, optionGroupId),
		});

		if (!existing) {
			throw new Error("Option group not found");
		}

		const existingTranslations = (existing.translations ??
			{}) as EntityTranslations;
		const cleanedNew = cleanTranslations(translations);
		const mergedTranslations = { ...existingTranslations, ...cleanedNew };

		const [updated] = await db
			.update(optionGroups)
			.set({ translations: mergedTranslations })
			.where(eq(optionGroups.id, optionGroupId))
			.returning();

		return updated;
	});

/**
 * Update translations for an option choice.
 */
export const updateOptionChoiceTranslations = createServerFn({ method: "POST" })
	.inputValidator(updateOptionChoiceTranslationsSchema)
	.handler(async ({ data }) => {
		const { optionChoiceId, translations } = data;

		const existing = await db.query.optionChoices.findFirst({
			where: eq(optionChoices.id, optionChoiceId),
		});

		if (!existing) {
			throw new Error("Option choice not found");
		}

		const existingTranslations = (existing.translations ??
			{}) as ChoiceTranslations;
		const cleanedNew = cleanChoiceTranslations(translations);
		const mergedTranslations = { ...existingTranslations, ...cleanedNew };

		const [updated] = await db
			.update(optionChoices)
			.set({ translations: mergedTranslations })
			.where(eq(optionChoices.id, optionChoiceId))
			.returning();

		return updated;
	});
