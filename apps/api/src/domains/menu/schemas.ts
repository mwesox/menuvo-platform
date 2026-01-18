/**
 * Menu Domain Schemas
 *
 * Zod schemas for menu-level operations (shop-facing public procedures).
 */

import { z } from "zod";

// Re-export domain type from settings for consistency
export type { EnabledOrderTypes } from "../stores/settings/types.js";

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
// OUTPUT TYPES
// ============================================================================

/**
 * Enabled order types schema (for API validation)
 */
export const enabledOrderTypesSchema = z.object({
	dine_in: z.boolean(),
	takeaway: z.boolean(),
	delivery: z.boolean(),
});

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
	enabledOrderTypes: enabledOrderTypesSchema.optional(),
	status: z
		.object({
			isOpen: z.boolean(),
			nextOpenTime: z.string().nullable(),
		})
		.optional(),
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
	hasOptionGroups: z.boolean(),
});

export type PublicItem = z.infer<typeof publicItemSchema>;

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
	capabilities: z.object({
		canAcceptOnlinePayment: z.boolean(),
	}),
});

export type MenuResponse = z.infer<typeof menuResponseSchema>;
