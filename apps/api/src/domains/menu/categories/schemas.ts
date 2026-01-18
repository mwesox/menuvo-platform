/**
 * Category Schemas
 *
 * Zod schemas for category-related API inputs.
 * Categories support translations stored as JSONB: {"de": {name, description}, "en": {...}}
 */

import { z } from "zod";

// ============================================================================
// Translation Schema
// ============================================================================

/**
 * Schema for category translation entry (per language)
 */
export const categoryTranslationSchema = z.object({
	name: z.string().min(1, "Category name is required"),
	description: z.string().optional(),
});

/**
 * Schema for translations record (all languages)
 */
export const categoryTranslationsSchema = z.record(
	z.string(),
	categoryTranslationSchema,
);

// ============================================================================
// API Schemas
// ============================================================================

/**
 * List categories for a store - API schema
 */
export const listCategoriesSchema = z.object({
	storeId: z.string().uuid("Invalid store ID"),
});

/**
 * Get category by ID - API schema
 */
export const getCategoryByIdSchema = z.object({
	id: z.string().uuid("Invalid category ID"),
});

/**
 * Create category - API schema (typed)
 * Includes translations as JSONB for i18n support
 */
export const createCategorySchema = z.object({
	storeId: z.string().uuid("Invalid store ID"),
	translations: categoryTranslationsSchema.refine(
		(translations) => Object.keys(translations).length > 0,
		{ message: "At least one translation is required" },
	),
	displayOrder: z.number().int().optional(),
	isActive: z.boolean().default(true),
	/** Default VAT group for items in this category */
	defaultVatGroupId: z.string().uuid("Invalid VAT group ID").optional(),
});

/**
 * Update category - API schema
 * All fields optional except id
 */
export const updateCategorySchema = z.object({
	id: z.string().uuid("Invalid category ID"),
	translations: categoryTranslationsSchema.optional(),
	displayOrder: z.number().int().optional(),
	isActive: z.boolean().optional(),
	/** Default VAT group for items in this category */
	defaultVatGroupId: z
		.string()
		.uuid("Invalid VAT group ID")
		.nullable()
		.optional(),
});

/**
 * Reorder categories - API schema
 * categoryIds array determines the new display order (index = displayOrder)
 */
export const reorderCategoriesSchema = z.object({
	storeId: z.string().uuid("Invalid store ID"),
	categoryIds: z
		.array(z.string().uuid("Invalid category ID"))
		.min(1, "At least one category ID is required"),
});

/**
 * Toggle category active status - API schema
 */
export const toggleCategoryActiveSchema = z.object({
	id: z.string().uuid("Invalid category ID"),
	isActive: z.boolean(),
});

/**
 * Delete category - API schema
 */
export const deleteCategorySchema = z.object({
	id: z.string().uuid("Invalid category ID"),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CategoryTranslation = z.infer<typeof categoryTranslationSchema>;
export type CategoryTranslations = z.infer<typeof categoryTranslationsSchema>;
export type ListCategoriesInput = z.infer<typeof listCategoriesSchema>;
export type GetCategoryByIdInput = z.infer<typeof getCategoryByIdSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
export type ToggleCategoryActiveInput = z.infer<
	typeof toggleCategoryActiveSchema
>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
