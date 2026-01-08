/**
 * Public Router Schemas
 *
 * Zod schemas for public-facing procedures (no auth required).
 * Used by the shop app for:
 * - Menu viewing
 * - Store discovery
 * - Item details
 */

import { z } from "zod";

// ============================================================================
// GET MENU
// ============================================================================

/**
 * Schema for fetching a store's complete menu
 */
export const getMenuSchema = z.object({
	/** Store's URL-friendly identifier */
	storeSlug: z.string().min(1, "Store slug is required"),
	/** ISO language code for translations (default: German) */
	languageCode: z.string().min(2).max(5).default("de"),
});

export type GetMenuInput = z.infer<typeof getMenuSchema>;

// ============================================================================
// SEARCH STORES
// ============================================================================

/**
 * Schema for searching stores by name, city, or location
 */
export const searchStoresSchema = z.object({
	/** Text search query (store name, description) */
	query: z.string().max(100).optional(),
	/** Filter by city name */
	city: z.string().max(100).optional(),
	/** Latitude for geo-search */
	lat: z.number().min(-90).max(90).optional(),
	/** Longitude for geo-search */
	lng: z.number().min(-180).max(180).optional(),
	/** Search radius in kilometers (for geo-search) */
	radius: z.number().positive().max(100).optional(),
	/** Maximum number of results */
	limit: z.number().int().min(1).max(50).default(20),
	/** Cursor for pagination (store ID) */
	cursor: z.string().uuid().optional(),
});

export type SearchStoresInput = z.infer<typeof searchStoresSchema>;

// ============================================================================
// GET FEATURED STORES
// ============================================================================

/**
 * Schema for fetching featured stores for the discovery page
 */
export const getFeaturedStoresSchema = z.object({
	/** Filter featured stores by city */
	city: z.string().max(100).optional(),
	/** Maximum number of featured stores to return */
	limit: z.number().int().min(1).max(20).default(10),
});

export type GetFeaturedStoresInput = z.infer<typeof getFeaturedStoresSchema>;

// ============================================================================
// GET ITEM DETAILS
// ============================================================================

/**
 * Schema for fetching detailed item information
 * Used for SEO pages and sharing
 */
export const getItemDetailsSchema = z.object({
	/** UUID of the item */
	itemId: z.string().uuid("Invalid item ID"),
	/** ISO language code for translations (default: German) */
	languageCode: z.string().min(2).max(5).default("de"),
});

export type GetItemDetailsInput = z.infer<typeof getItemDetailsSchema>;

// ============================================================================
// OUTPUT TYPES
// ============================================================================

/**
 * Translated entity with name and optional description
 */
export const translatedEntitySchema = z.object({
	name: z.string(),
	description: z.string().nullable(),
});

export type TranslatedEntity = z.infer<typeof translatedEntitySchema>;

/**
 * Public store info (minimal, safe for public exposure)
 */
export const publicStoreSchema = z.object({
	id: z.string().uuid(),
	slug: z.string(),
	name: z.string(),
	logoUrl: z.string().nullable(),
	street: z.string().nullable(),
	city: z.string().nullable(),
	postalCode: z.string().nullable(),
	country: z.string().nullable(),
	currency: z.string(),
});

export type PublicStore = z.infer<typeof publicStoreSchema>;

/**
 * Public category info
 */
export const publicCategorySchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable(),
	displayOrder: z.number(),
});

export type PublicCategory = z.infer<typeof publicCategorySchema>;

/**
 * Public item info
 */
export const publicItemSchema = z.object({
	id: z.string().uuid(),
	categoryId: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable(),
	price: z.number().int(),
	imageUrl: z.string().nullable(),
	allergens: z.array(z.string()).nullable(),
	displayOrder: z.number(),
});

export type PublicItem = z.infer<typeof publicItemSchema>;

/**
 * Public option choice
 */
export const publicOptionChoiceSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	priceModifier: z.number().int(),
	isDefault: z.boolean(),
	displayOrder: z.number(),
});

export type PublicOptionChoice = z.infer<typeof publicOptionChoiceSchema>;

/**
 * Public option group with choices
 */
export const publicOptionGroupSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable(),
	type: z.enum(["single_select", "multi_select", "quantity_select"]),
	isRequired: z.boolean(),
	minSelections: z.number().int(),
	maxSelections: z.number().int().nullable(),
	numFreeOptions: z.number().int(),
	aggregateMinQuantity: z.number().int().nullable(),
	aggregateMaxQuantity: z.number().int().nullable(),
	displayOrder: z.number(),
	choices: z.array(publicOptionChoiceSchema),
});

export type PublicOptionGroup = z.infer<typeof publicOptionGroupSchema>;

/**
 * Item with option groups for detail view
 */
export const publicItemWithOptionsSchema = publicItemSchema.extend({
	optionGroups: z.array(publicOptionGroupSchema),
});

export type PublicItemWithOptions = z.infer<typeof publicItemWithOptionsSchema>;

/**
 * Complete menu response
 */
export const menuResponseSchema = z.object({
	store: publicStoreSchema,
	categories: z.array(
		publicCategorySchema.extend({
			items: z.array(publicItemSchema),
		}),
	),
});

export type MenuResponse = z.infer<typeof menuResponseSchema>;
