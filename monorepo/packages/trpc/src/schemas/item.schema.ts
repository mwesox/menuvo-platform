/**
 * Item Schemas
 *
 * Zod validation schemas for menu item operations.
 * Following the Three Schema Rule:
 * - API schemas: Typed for API contracts
 * - Form schemas: String-based for HTML inputs
 */

import { z } from "zod";

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * Translation schema for item name and description
 */
export const itemTranslationSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().optional(),
});

/**
 * Translations record: language code -> translation
 */
export const itemTranslationsSchema = z.record(
	z.string(),
	itemTranslationSchema,
);

// ============================================================================
// API SCHEMAS (Typed)
// ============================================================================

/**
 * List items by category - API schema
 */
export const listItemsByCategorySchema = z.object({
	categoryId: z.string().uuid("Invalid category ID"),
});

/**
 * List items by store - API schema
 */
export const listItemsByStoreSchema = z.object({
	storeId: z.string().uuid("Invalid store ID"),
});

/**
 * Get item by ID - API schema
 */
export const getItemByIdSchema = z.object({
	id: z.string().uuid("Invalid item ID"),
});

/**
 * Create item - API schema
 * Note: storeId is NOT included because storeOwnerProcedure provides ctx.storeId
 */
export const createItemApiSchema = z.object({
	categoryId: z.string().uuid("Invalid category ID"),
	translations: itemTranslationsSchema,
	price: z.number().int().nonnegative("Price must be non-negative"), // Price in cents
	imageUrl: z.string().url("Invalid image URL").optional(),
	isAvailable: z.boolean().default(true),
	displayOrder: z.number().int().optional(),
	allergens: z.array(z.string()).optional(),
	kitchenName: z.string().max(50).optional(),
});

/**
 * Update item - API schema
 */
export const updateItemApiSchema = z.object({
	id: z.string().uuid("Invalid item ID"),
	categoryId: z.string().uuid("Invalid category ID").optional(),
	translations: itemTranslationsSchema.optional(),
	price: z.number().int().nonnegative("Price must be non-negative").optional(),
	imageUrl: z.string().url("Invalid image URL").nullable().optional(),
	isAvailable: z.boolean().optional(),
	displayOrder: z.number().int().optional(),
	allergens: z.array(z.string()).optional(),
	kitchenName: z.string().max(50).nullable().optional(),
});

/**
 * Delete item - API schema
 */
export const deleteItemSchema = z.object({
	id: z.string().uuid("Invalid item ID"),
});

/**
 * Reorder items within category - API schema
 */
export const reorderItemsSchema = z.object({
	categoryId: z.string().uuid("Invalid category ID"),
	itemIds: z.array(z.string().uuid("Invalid item ID")),
});

/**
 * Toggle item availability - API schema
 */
export const toggleItemAvailabilitySchema = z.object({
	id: z.string().uuid("Invalid item ID"),
	isAvailable: z.boolean(),
});

// ============================================================================
// FORM SCHEMAS (String-based for HTML inputs)
// ============================================================================

/**
 * Translation form schema
 */
export const itemTranslationFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name is too long"),
	description: z.string().max(1000, "Description is too long").optional(),
});

/**
 * Create item - Form schema
 */
export const createItemFormSchema = z.object({
	translations: z.record(z.string(), itemTranslationFormSchema),
	price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"), // String for form input
	imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
	allergens: z.string().optional(), // Comma-separated in form
	kitchenName: z.string().max(50, "Kitchen name is too long").optional(),
});

/**
 * Update item - Form schema
 */
export const updateItemFormSchema = z.object({
	translations: z.record(z.string(), itemTranslationFormSchema).optional(),
	price: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Invalid price format")
		.optional(),
	imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
	allergens: z.string().optional(),
	kitchenName: z
		.string()
		.max(50, "Kitchen name is too long")
		.optional()
		.or(z.literal("")),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ItemTranslation = z.infer<typeof itemTranslationSchema>;
export type ItemTranslations = z.infer<typeof itemTranslationsSchema>;

// API types
export type ListItemsByCategoryInput = z.infer<
	typeof listItemsByCategorySchema
>;
export type ListItemsByStoreInput = z.infer<typeof listItemsByStoreSchema>;
export type GetItemByIdInput = z.infer<typeof getItemByIdSchema>;
export type CreateItemApiInput = z.infer<typeof createItemApiSchema>;
export type UpdateItemApiInput = z.infer<typeof updateItemApiSchema>;
export type DeleteItemInput = z.infer<typeof deleteItemSchema>;
export type ReorderItemsInput = z.infer<typeof reorderItemsSchema>;
export type ToggleItemAvailabilityInput = z.infer<
	typeof toggleItemAvailabilitySchema
>;

// Form types
export type ItemTranslationFormValues = z.infer<
	typeof itemTranslationFormSchema
>;
export type CreateItemFormValues = z.infer<typeof createItemFormSchema>;
export type UpdateItemFormValues = z.infer<typeof updateItemFormSchema>;
