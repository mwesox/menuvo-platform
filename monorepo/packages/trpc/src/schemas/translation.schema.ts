/**
 * Translation Schemas
 *
 * Zod schemas for translation-related API inputs.
 * Supports single-language translation updates for menu entities.
 */

import { z } from "zod";

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Language code schema - supports ISO 639-1 (2 char) and extended codes (up to 5 char)
 */
export const languageCodeSchema = z.string().min(2).max(5);

// ============================================================================
// Query Schemas
// ============================================================================

/**
 * Get translation status for a store - API schema
 */
export const getTranslationStatusSchema = z.object({
	storeId: z.string().uuid("Invalid store ID"),
});

/**
 * Get missing translations report - API schema
 */
export const getMissingTranslationsSchema = z.object({
	storeId: z.string().uuid("Invalid store ID"),
	languageCode: languageCodeSchema.optional(),
});

// ============================================================================
// Mutation Schemas - Single Language Updates
// ============================================================================

/**
 * Update category translations for a single language - API schema
 */
export const updateCategoryTranslationsSchema = z.object({
	categoryId: z.string().uuid("Invalid category ID"),
	languageCode: languageCodeSchema,
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
});

/**
 * Update item translations for a single language - API schema
 */
export const updateItemTranslationsSchema = z.object({
	itemId: z.string().uuid("Invalid item ID"),
	languageCode: languageCodeSchema,
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
});

/**
 * Update option group translations for a single language - API schema
 */
export const updateOptionGroupTranslationsSchema = z.object({
	optionGroupId: z.string().uuid("Invalid option group ID"),
	languageCode: languageCodeSchema,
	name: z.string().min(1, "Name is required"),
});

/**
 * Update option choice translations for a single language - API schema
 */
export const updateOptionChoiceTranslationsSchema = z.object({
	optionChoiceId: z.string().uuid("Invalid option choice ID"),
	languageCode: languageCodeSchema,
	name: z.string().min(1, "Name is required"),
});

// ============================================================================
// Type Exports
// ============================================================================

export type GetTranslationStatusInput = z.infer<
	typeof getTranslationStatusSchema
>;
export type GetMissingTranslationsInput = z.infer<
	typeof getMissingTranslationsSchema
>;
export type UpdateCategoryTranslationsInput = z.infer<
	typeof updateCategoryTranslationsSchema
>;
export type UpdateItemTranslationsInput = z.infer<
	typeof updateItemTranslationsSchema
>;
export type UpdateOptionGroupTranslationsInput = z.infer<
	typeof updateOptionGroupTranslationsSchema
>;
export type UpdateOptionChoiceTranslationsInput = z.infer<
	typeof updateOptionChoiceTranslationsSchema
>;
