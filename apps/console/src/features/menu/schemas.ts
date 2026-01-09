import type { CategoryTranslations } from "@menuvo/trpc/schemas";
import { z } from "zod";

// ============================================================================
// TRANSLATION SCHEMAS
// ============================================================================

// Import correct schemas from tRPC package
import { categoryTranslationsSchema } from "@menuvo/trpc/schemas";

/**
 * Schema for entity translations (name + description).
 * Used in create/update operations for categories and items.
 * Re-exported from tRPC schemas for consistency.
 */
export const entityTranslationsSchema = categoryTranslationsSchema;

// ============================================================================
// CATEGORIES
// ============================================================================

export const createCategorySchema = z.object({
	storeId: z.string().uuid(),
	translations: entityTranslationsSchema.refine(
		(t) => Object.values(t).some((v) => v.name && v.name.length >= 2),
		"validation:categoryMultilang.required",
	),
	displayOrder: z.number().int().min(0).optional(),
});

export const updateCategorySchema = z.object({
	translations: entityTranslationsSchema.optional(),
	displayOrder: z.number().int().min(0).optional(),
	isActive: z.boolean().optional(),
});

// Client-side category form schema (for a specific language)
export const categoryFormSchema = z.object({
	name: z
		.string()
		.min(2, "validation:categoryName.min")
		.max(100, "validation:categoryName.max"),
	description: z.string(),
});
export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// Category type inferred from tRPC response
export type Category = {
	id: string;
	storeId: string;
	translations: CategoryTranslations;
	displayOrder: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
};

// ============================================================================
// ITEMS
// ============================================================================

export const createItemSchema = z.object({
	categoryId: z.string().uuid(),
	storeId: z.string().uuid(),
	translations: entityTranslationsSchema.refine(
		(t) => Object.values(t).some((v) => v.name && v.name.length >= 2),
		"validation:itemMultilang.required",
	),
	price: z.number().int().min(0, "Price must be positive"), // Price in cents
	imageUrl: z.string().url().optional().or(z.literal("")),
	allergens: z.array(z.string()).default([]),
	kitchenName: z.string().max(50).optional().or(z.literal("")),
	displayOrder: z.number().int().min(0).default(0),
});

export const updateItemSchema = z.object({
	translations: entityTranslationsSchema.optional(),
	price: z.number().int().min(0, "Price must be positive").optional(),
	imageUrl: z.string().url().optional().or(z.literal("")),
	allergens: z.array(z.string()).optional(),
	kitchenName: z.string().max(50).optional().or(z.literal("")),
	displayOrder: z.number().int().min(0).optional(),
	isAvailable: z.boolean().optional(),
	categoryId: z.string().uuid().optional(),
});

// Client-side item form schema (for a specific language, with price as string)
export const itemFormSchema = z.object({
	categoryId: z.string().min(1, "validation:itemCategory.required"),
	name: z
		.string()
		.min(2, "validation:itemName.min")
		.max(100, "validation:itemName.max"),
	description: z.string(),
	price: z.string().min(1, "validation:itemPrice.required"),
	imageUrl: z.string(),
	allergens: z.array(z.string()),
	kitchenName: z.string().max(50),
});
export type ItemFormInput = z.infer<typeof itemFormSchema>;

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Loose input type for existing translations (from DB, may have optional name)
type LooseTranslations = Record<
	string,
	{ name?: string; description?: string } | undefined
>;

/**
 * Transform form input (name, description for a specific language)
 * into translations JSONB format for server.
 */
export function formToTranslations(
	formData: { name: string; description: string },
	language: string,
	existingTranslations?: LooseTranslations,
): CategoryTranslations {
	// Start with empty object and only include translations that have valid names
	const result: CategoryTranslations = {};

	// Add existing translations that have valid names
	if (existingTranslations) {
		for (const [lang, translation] of Object.entries(existingTranslations)) {
			if (translation?.name) {
				result[lang] = {
					name: translation.name,
					description: translation.description,
				};
			}
		}
	}

	// Add/update the current language translation
	result[language] = {
		name: formData.name,
		description: formData.description,
	};

	return result;
}

/**
 * Extract form values from translations for a specific language.
 */
export function translationsToForm(
	translations: LooseTranslations | null,
	language: string,
): { name: string; description: string } {
	const t = translations?.[language];
	return {
		name: t?.name ?? "",
		description: t?.description ?? "",
	};
}
