/**
 * Translation Router
 *
 * Handles translation procedures:
 * - Translation status queries
 * - Entity translation updates (single language per update)
 * - Missing translation reports
 */

import {
	type ChoiceTranslations,
	categories,
	type EntityTranslations,
	items,
	optionChoices,
	optionGroups,
	stores,
} from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { Context } from "../context.js";
import {
	getMissingTranslationsSchema,
	getTranslationStatusSchema,
	updateCategoryTranslationsSchema,
	updateItemTranslationsSchema,
	updateOptionChoiceTranslationsSchema,
	updateOptionGroupTranslationsSchema,
} from "../schemas/translation.schema.js";
import { protectedProcedure, router, storeOwnerProcedure } from "../trpc.js";

type TranslationStatus = "complete" | "partial" | "missing";

// ============================================================================
// Helper Functions
// ============================================================================

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

async function getStoreWithMerchant(
	ctx: Context,
	storeId: string,
	merchantId: string,
) {
	const store = await ctx.db.query.stores.findFirst({
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

async function getCategoryWithOwnership(
	ctx: Context,
	categoryId: string,
	merchantId: string,
) {
	const category = await ctx.db.query.categories.findFirst({
		where: eq(categories.id, categoryId),
		with: { store: { columns: { merchantId: true } } },
	});
	if (!category || category.store.merchantId !== merchantId) {
		return null;
	}
	return category;
}

async function getItemWithOwnership(
	ctx: Context,
	itemId: string,
	merchantId: string,
) {
	const item = await ctx.db.query.items.findFirst({
		where: eq(items.id, itemId),
		with: { store: { columns: { merchantId: true } } },
	});
	if (!item || item.store.merchantId !== merchantId) {
		return null;
	}
	return item;
}

async function getOptionGroupWithOwnership(
	ctx: Context,
	optionGroupId: string,
	merchantId: string,
) {
	const og = await ctx.db.query.optionGroups.findFirst({
		where: eq(optionGroups.id, optionGroupId),
		with: { store: { columns: { merchantId: true } } },
	});
	if (!og || og.store.merchantId !== merchantId) {
		return null;
	}
	return og;
}

async function getOptionChoiceWithOwnership(
	ctx: Context,
	optionChoiceId: string,
	merchantId: string,
) {
	const choice = await ctx.db.query.optionChoices.findFirst({
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

// ============================================================================
// Router Definition
// ============================================================================

export const translationRouter = router({
	/**
	 * Get translation status for all entities in a store
	 */
	getStatus: protectedProcedure
		.input(getTranslationStatusSchema)
		.query(async ({ ctx, input }) => {
			const store = await getStoreWithMerchant(
				ctx,
				input.storeId,
				ctx.session.merchantId,
			);
			if (!store) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found or access denied",
				});
			}

			const supportedLanguages = store.merchant.supportedLanguages ?? [];

			// Get all entities
			const allCategories = await ctx.db.query.categories.findMany({
				where: eq(categories.storeId, input.storeId),
				orderBy: (c, { asc }) => [asc(c.displayOrder)],
			});

			const allItems = await ctx.db.query.items.findMany({
				where: eq(items.storeId, input.storeId),
				orderBy: (i, { asc }) => [asc(i.displayOrder)],
			});

			const allOptionGroups = await ctx.db.query.optionGroups.findMany({
				where: eq(optionGroups.storeId, input.storeId),
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
						choices: og.choices.map((choice) => {
							const choiceStatusInfo = calculateStatus(
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
		}),

	/**
	 * Get missing translations report
	 */
	getMissingReport: protectedProcedure
		.input(getMissingTranslationsSchema)
		.query(async ({ ctx, input }) => {
			const store = await getStoreWithMerchant(
				ctx,
				input.storeId,
				ctx.session.merchantId,
			);
			if (!store) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found or access denied",
				});
			}

			const supportedLanguages = store.merchant.supportedLanguages ?? [];
			const targetLanguages = input.languageCode
				? [input.languageCode]
				: supportedLanguages;

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
			const allCategories = await ctx.db.query.categories.findMany({
				where: eq(categories.storeId, input.storeId),
			});
			const allItems = await ctx.db.query.items.findMany({
				where: eq(items.storeId, input.storeId),
			});
			const allOptionGroups = await ctx.db.query.optionGroups.findMany({
				where: eq(optionGroups.storeId, input.storeId),
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

			const totalChoices = allOptionGroups.reduce(
				(sum, og) => sum + og.choices.length,
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
		}),

	/**
	 * Update category translations for a single language
	 */
	updateCategory: storeOwnerProcedure
		.input(updateCategoryTranslationsSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await getCategoryWithOwnership(
				ctx,
				input.categoryId,
				ctx.session.merchantId,
			);
			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Category not found or access denied",
				});
			}

			const existingTranslations = (existing.translations ??
				{}) as EntityTranslations;

			// Update only the specified language
			const mergedTranslations: EntityTranslations = {
				...existingTranslations,
				[input.languageCode]: {
					name: input.name,
					description: input.description,
				},
			};

			const [updated] = await ctx.db
				.update(categories)
				.set({ translations: mergedTranslations })
				.where(eq(categories.id, input.categoryId))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update category translations",
				});
			}

			return updated;
		}),

	/**
	 * Update item translations for a single language
	 */
	updateItem: storeOwnerProcedure
		.input(updateItemTranslationsSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await getItemWithOwnership(
				ctx,
				input.itemId,
				ctx.session.merchantId,
			);
			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Item not found or access denied",
				});
			}

			const existingTranslations = (existing.translations ??
				{}) as EntityTranslations;

			// Update only the specified language
			const mergedTranslations: EntityTranslations = {
				...existingTranslations,
				[input.languageCode]: {
					name: input.name,
					description: input.description,
				},
			};

			const [updated] = await ctx.db
				.update(items)
				.set({ translations: mergedTranslations })
				.where(eq(items.id, input.itemId))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update item translations",
				});
			}

			return updated;
		}),

	/**
	 * Update option group translations for a single language
	 */
	updateOptionGroup: storeOwnerProcedure
		.input(updateOptionGroupTranslationsSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await getOptionGroupWithOwnership(
				ctx,
				input.optionGroupId,
				ctx.session.merchantId,
			);
			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Option group not found or access denied",
				});
			}

			const existingTranslations = (existing.translations ??
				{}) as EntityTranslations;

			// Update only the specified language
			const mergedTranslations: EntityTranslations = {
				...existingTranslations,
				[input.languageCode]: {
					name: input.name,
				},
			};

			const [updated] = await ctx.db
				.update(optionGroups)
				.set({ translations: mergedTranslations })
				.where(eq(optionGroups.id, input.optionGroupId))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update option group translations",
				});
			}

			return updated;
		}),

	/**
	 * Update option choice translations for a single language
	 */
	updateOptionChoice: storeOwnerProcedure
		.input(updateOptionChoiceTranslationsSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await getOptionChoiceWithOwnership(
				ctx,
				input.optionChoiceId,
				ctx.session.merchantId,
			);
			if (!existing) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Option choice not found or access denied",
				});
			}

			const existingTranslations = (existing.translations ??
				{}) as ChoiceTranslations;

			// Update only the specified language
			const mergedTranslations: ChoiceTranslations = {
				...existingTranslations,
				[input.languageCode]: {
					name: input.name,
				},
			};

			const [updated] = await ctx.db
				.update(optionChoices)
				.set({ translations: mergedTranslations })
				.where(eq(optionChoices.id, input.optionChoiceId))
				.returning();

			if (!updated) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update option choice translations",
				});
			}

			return updated;
		}),
});
