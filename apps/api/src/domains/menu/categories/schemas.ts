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
// Availability Schedule Schema
// ============================================================================

/**
 * Time format validation (HH:MM)
 */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Days of week enum
 */
const daysOfWeekSchema = z.enum([
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
]);

/**
 * Availability schedule schema for categories
 */
export const availabilityScheduleSchema = z
	.object({
		enabled: z.boolean(),
		timeRange: z
			.object({
				startTime: z
					.string()
					.regex(timeRegex, "Time must be in HH:MM format (00:00 - 23:59)"),
				endTime: z
					.string()
					.regex(timeRegex, "Time must be in HH:MM format (00:00 - 23:59)"),
			})
			.optional(),
		daysOfWeek: z.array(daysOfWeekSchema).optional(),
		dateRange: z
			.object({
				startDate: z.string().date("Start date must be a valid date"),
				endDate: z.string().date("End date must be a valid date"),
			})
			.optional(),
	})
	.refine(
		(data) => {
			// If schedule is disabled, any configuration is valid
			if (!data.enabled) return true;
			// If enabled, at least one rule must be specified
			return (
				data.timeRange !== undefined ||
				data.daysOfWeek !== undefined ||
				data.dateRange !== undefined
			);
		},
		{
			message:
				"When schedule is enabled, at least one rule (time, day, or date) must be specified",
		},
	)
	.refine(
		(data) => {
			if (!data.enabled || !data.dateRange) return true;
			// Validate date range: startDate <= endDate
			const start = new Date(data.dateRange.startDate);
			const end = new Date(data.dateRange.endDate);
			return start <= end;
		},
		{
			message: "Start date must be before or equal to end date",
			path: ["dateRange"],
		},
	)
	.refine(
		(data) => {
			if (!data.enabled || !data.timeRange) return true;
			// Allow midnight crossover (e.g., 22:00-02:00)
			// But validate that times are valid
			const start = data.timeRange.startTime;
			const end = data.timeRange.endTime;
			// If start > end, it's a midnight crossover (valid)
			// If start <= end, it's a normal range (valid)
			return true; // Time format already validated by regex
		},
		{
			message: "Invalid time range",
			path: ["timeRange"],
		},
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
	/** Availability schedule configuration */
	availabilitySchedule: availabilityScheduleSchema.nullable().optional(),
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
	/** Availability schedule configuration */
	availabilitySchedule: availabilityScheduleSchema.nullable().optional(),
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
export type AvailabilitySchedule = z.infer<typeof availabilityScheduleSchema>;
export type ListCategoriesInput = z.infer<typeof listCategoriesSchema>;
export type GetCategoryByIdInput = z.infer<typeof getCategoryByIdSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
export type ToggleCategoryActiveInput = z.infer<
	typeof toggleCategoryActiveSchema
>;
export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
