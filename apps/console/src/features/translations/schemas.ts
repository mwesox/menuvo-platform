import { z } from "zod";
import { ENTITY_TYPES, LANGUAGE_CODES } from "./constants.ts";

// Re-export types from constants
export type { EntityType, LanguageCode } from "./constants.ts";

// ============================================================================
// LANGUAGE CONFIGURATION
// ============================================================================

export const languageCodeSchema = z.enum(LANGUAGE_CODES);

// ============================================================================
// MERCHANT LANGUAGE SETTINGS
// ============================================================================

/**
 * Form schema for updating supported languages.
 * All languages are equal - first in array is used as fallback when needed.
 */
export const supportedLanguagesFormSchema = z.object({
	supportedLanguages: z
		.array(languageCodeSchema)
		.min(1, "At least one language is required"),
});
export type SupportedLanguagesFormInput = z.infer<
	typeof supportedLanguagesFormSchema
>;

/**
 * Server schema for updating supported languages.
 * merchantId is obtained from auth context on server.
 */
export const updateSupportedLanguagesSchema = z.object({
	supportedLanguages: z
		.array(languageCodeSchema)
		.min(1, "At least one language is required"),
});
export type UpdateSupportedLanguagesInput = z.infer<
	typeof updateSupportedLanguagesSchema
>;

// ============================================================================
// TRANSLATION SCHEMAS
// ============================================================================

/**
 * Translation fields for entities with name and description.
 */
const translationFieldsSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
});

/**
 * Translation fields for entities with only name (option choices).
 */
const choiceTranslationFieldsSchema = z.object({
	name: z.string().optional(),
});

/**
 * Translation record: language code -> translation fields.
 * Allow undefined values to be filtered out during processing.
 */
export const entityTranslationSchema = z.record(
	languageCodeSchema,
	translationFieldsSchema.optional(),
);
export type EntityTranslation = z.infer<typeof entityTranslationSchema>;

export const choiceTranslationSchema = z.record(
	languageCodeSchema,
	choiceTranslationFieldsSchema.optional(),
);
export type ChoiceTranslation = z.infer<typeof choiceTranslationSchema>;

// ============================================================================
// UPDATE TRANSLATION SCHEMAS (Server Input)
// ============================================================================

/**
 * Update translations for a category.
 */
export const updateCategoryTranslationsSchema = z.object({
	categoryId: z.string().uuid(),
	translations: entityTranslationSchema,
});
export type UpdateCategoryTranslationsInput = z.infer<
	typeof updateCategoryTranslationsSchema
>;

/**
 * Update translations for an item.
 */
export const updateItemTranslationsSchema = z.object({
	itemId: z.string().uuid(),
	translations: entityTranslationSchema,
});
export type UpdateItemTranslationsInput = z.infer<
	typeof updateItemTranslationsSchema
>;

/**
 * Update translations for an option group.
 */
export const updateOptionGroupTranslationsSchema = z.object({
	optionGroupId: z.string().uuid(),
	translations: entityTranslationSchema,
});
export type UpdateOptionGroupTranslationsInput = z.infer<
	typeof updateOptionGroupTranslationsSchema
>;

/**
 * Update translations for an option choice.
 */
export const updateOptionChoiceTranslationsSchema = z.object({
	optionChoiceId: z.string().uuid(),
	translations: choiceTranslationSchema,
});
export type UpdateOptionChoiceTranslationsInput = z.infer<
	typeof updateOptionChoiceTranslationsSchema
>;

// ============================================================================
// FORM SCHEMAS
// ============================================================================

/**
 * Form schema for editing translations of a single entity.
 */
export const translationFormSchema = z.object({
	translations: z.record(
		z.string(),
		z.object({
			name: z.string(),
			description: z.string(),
		}),
	),
});
export type TranslationFormInput = z.infer<typeof translationFormSchema>;

/**
 * Form schema for editing choice translations (name only).
 */
export const choiceTranslationFormSchema = z.object({
	translations: z.record(
		z.string(),
		z.object({
			name: z.string(),
		}),
	),
});
export type ChoiceTranslationFormInput = z.infer<
	typeof choiceTranslationFormSchema
>;

// ============================================================================
// TRANSLATION STATUS TYPES
// ============================================================================

/**
 * Translation status for a single entity.
 */
export type TranslationStatus = "complete" | "partial" | "missing";

/**
 * Filter options for the translation list.
 */
export const translationFilterSchema = z.object({
	entityType: z.enum(["all", ...ENTITY_TYPES]).default("all"),
	language: z.string().default("all"),
	status: z.enum(["all", "complete", "partial", "missing"]).default("all"),
	search: z.string().default(""),
});
export type TranslationFilter = z.infer<typeof translationFilterSchema>;
