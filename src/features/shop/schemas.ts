import { z } from "zod";

// ============================================================================
// Option Group Type Enum
// ============================================================================

export const optionGroupTypeSchema = z.enum([
	"single_select",
	"multi_select",
	"quantity_select",
]);

export type OptionGroupType = z.infer<typeof optionGroupTypeSchema>;

// ============================================================================
// Menu Item Schemas
// ============================================================================

/**
 * Schema for option choice as returned from API.
 * Now includes isDefault, minQuantity, maxQuantity, isAvailable from DB.
 */
export const menuItemChoiceSchema = z.object({
	id: z.number(),
	name: z.string(),
	priceModifier: z.number(),
	displayOrder: z.number(),
	isDefault: z.boolean(),
	isAvailable: z.boolean(),
	minQuantity: z.number(), // for quantity_select
	maxQuantity: z.number().nullable(), // for quantity_select, null = unlimited
});

export type MenuItemChoice = z.infer<typeof menuItemChoiceSchema>;

/**
 * @deprecated Use menuItemChoiceSchema directly - isDefault is now included in API response
 */
export const menuItemChoiceWithDefaultSchema = menuItemChoiceSchema;

export type MenuItemChoiceWithDefault = z.infer<
	typeof menuItemChoiceWithDefaultSchema
>;

/**
 * Schema for option group as returned from API.
 * Now includes type, numFreeOptions, and aggregate quantity constraints.
 */
export const menuItemOptionGroupSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().nullable(),
	type: optionGroupTypeSchema,
	isRequired: z.boolean(),
	minSelections: z.number(),
	maxSelections: z.number().nullable(), // null = unlimited
	numFreeOptions: z.number(), // first N choices are free
	aggregateMinQuantity: z.number().nullable(), // for quantity_select
	aggregateMaxQuantity: z.number().nullable(), // for quantity_select
	displayOrder: z.number(),
	choices: z.array(menuItemChoiceSchema),
});

export type MenuItemOptionGroup = z.infer<typeof menuItemOptionGroupSchema>;

/**
 * @deprecated Use menuItemOptionGroupSchema directly - defaults are now included in API response
 */
export const menuItemOptionGroupWithDefaultsSchema = menuItemOptionGroupSchema;

export type MenuItemOptionGroupWithDefaults = z.infer<
	typeof menuItemOptionGroupWithDefaultsSchema
>;

/**
 * Schema for menu item as returned from API.
 */
export const menuItemSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().nullable(),
	price: z.number(),
	imageUrl: z.string().nullable(),
	allergens: z.array(z.string()).nullable(),
	displayOrder: z.number(),
	optionGroups: z.array(menuItemOptionGroupSchema),
});

export type MenuItem = z.infer<typeof menuItemSchema>;

/**
 * Schema for menu item with defaults applied to choices.
 */
export const menuItemWithDefaultsSchema = menuItemSchema.extend({
	optionGroups: z.array(menuItemOptionGroupWithDefaultsSchema),
});

export type MenuItemWithDefaults = z.infer<typeof menuItemWithDefaultsSchema>;

// ============================================================================
// Light Menu Item Schemas (for efficient loading)
// ============================================================================

/**
 * Schema for menu item without option groups (light load).
 * Used for initial menu browsing - options loaded on demand when opening item drawer.
 */
export const menuItemLightSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().nullable(),
	price: z.number(),
	imageUrl: z.string().nullable(),
	allergens: z.array(z.string()).nullable(),
	displayOrder: z.number(),
	hasOptionGroups: z.boolean(), // Flag instead of full option data
});

export type MenuItemLight = z.infer<typeof menuItemLightSchema>;

/**
 * Schema for item options input.
 */
export const itemOptionsInputSchema = z.object({
	itemId: z.number(),
	storeSlug: z.string().min(1),
});

export type ItemOptionsInput = z.infer<typeof itemOptionsInputSchema>;

// ============================================================================
// Store Schemas
// ============================================================================

/**
 * Schema for filtering public stores.
 */
export const publicStoresFilterSchema = z
	.object({
		city: z.string().optional(),
		search: z.string().optional(),
	})
	.optional();

export type PublicStoresFilter = z.infer<typeof publicStoresFilterSchema>;

/**
 * Schema for getting a store by slug.
 */
export const storeBySlugSchema = z.object({
	slug: z.string().min(1, "Store slug is required"),
});

export type StoreBySlugInput = z.infer<typeof storeBySlugSchema>;
