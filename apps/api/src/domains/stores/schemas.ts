/**
 * Store Schemas
 *
 * API and Form schemas for store-related operations.
 * Following the Three Schema Rule:
 * - Form schemas: String-based for HTML inputs (used in client apps)
 * - API schemas: Typed for API contracts (used in tRPC procedures)
 */

import { z } from "zod";

// ============================================================================
// API SCHEMAS (Typed - used in tRPC procedures)
// ============================================================================

/**
 * Create store - API schema
 * Used by tRPC create procedure
 *
 * Note: This schema is aligned with the onboarding flow.
 * Address fields are required to ensure complete store data.
 * Timezone/currency have defaults matching the onboarding defaults.
 */
export const createStoreApiSchema = z.object({
	name: z.string().min(2, "Store name is required").max(255),
	// Address fields - required for complete store data
	street: z.string().min(1, "Street is required").max(255),
	city: z.string().min(1, "City is required").max(100),
	postalCode: z.string().min(1, "Postal code is required").max(20),
	country: z.string().min(1, "Country is required").max(100),
	// Contact fields - required
	phone: z.string().min(1, "Phone is required").max(50),
	email: z.string().min(1, "Email is required").email("Invalid email address"),
	// Settings - optional with defaults applied by database
	timezone: z.string().max(50).optional().default("Europe/Berlin"),
	currency: z
		.string()
		.length(3, "Currency must be 3 characters")
		.optional()
		.default("EUR"),
});

/**
 * Update store - API schema
 * Used by tRPC update procedure
 */
export const updateStoreApiSchema = z.object({
	storeId: z.string().uuid("Invalid store ID"),
	name: z.string().min(1, "Store name is required").max(255).optional(),
	street: z.string().max(255).optional(),
	city: z.string().max(100).optional(),
	postalCode: z.string().max(20).optional(),
	country: z.string().max(100).optional(),
	phone: z.string().min(1, "Phone is required").max(50).optional(),
	email: z
		.string()
		.min(1, "Email is required")
		.email("Invalid email address")
		.optional(),
	timezone: z.string().max(50).optional(),
	currency: z.string().length(3, "Currency must be 3 characters").optional(),
});

/**
 * Toggle store active status - API schema
 */
export const toggleStoreActiveApiSchema = z.object({
	storeId: z.string().uuid("Invalid store ID"),
	isActive: z.boolean(),
});

/**
 * Update store image - API schema
 */
export const updateStoreImageApiSchema = z.object({
	storeId: z.string().uuid("Invalid store ID"),
	imageUrl: z.string().url("Invalid image URL").optional().nullable(),
});

/**
 * Get store by ID - API schema
 */
export const getStoreByIdApiSchema = z.object({
	storeId: z.string().uuid("Invalid store ID"),
});

/**
 * Get store by slug - API schema
 */
export const getStoreBySlugApiSchema = z.object({
	slug: z.string().min(1, "Slug is required"),
});

/**
 * Delete store - API schema
 */
export const deleteStoreApiSchema = z.object({
	storeId: z.string().uuid("Invalid store ID"),
});

/**
 * Check slug availability - API schema
 * Used for real-time validation in the UI
 * Takes a name and generates the slug server-side
 */
export const checkSlugAvailabilityApiSchema = z.object({
	name: z.string().min(1, "Name is required").max(255),
	storeId: z.string().uuid("Invalid store ID").optional(),
});

// ============================================================================
// PUBLIC STORE PROCEDURES (Shop-facing)
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

/**
 * Schema for fetching featured stores for the discovery page
 */
export const getFeaturedStoresSchema = z.object({
	/** Filter featured stores by city */
	city: z.string().max(100).optional(),
	/** Maximum number of featured stores to return */
	limit: z.number().int().min(1).max(20).default(10),
});

/**
 * Schema for resolving QR code short code to store/service point
 */
export const resolveQRCodeSchema = z.object({
	shortCode: z.string(),
});

// ============================================================================
// FORM SCHEMAS (Strings - used in client forms)
// ============================================================================

/**
 * Create store - Form schema
 * All fields are strings for HTML input compatibility
 * Aligned with onboarding flow requirements
 */
export const createStoreFormSchema = z.object({
	name: z.string().min(2, "Store name is required").max(255),
	// Address fields - required
	street: z.string().min(1, "Street is required").max(255),
	city: z.string().min(1, "City is required").max(100),
	postalCode: z.string().min(1, "Postal code is required").max(20),
	country: z.string().min(1, "Country is required").max(100),
	// Contact fields - required
	phone: z.string().min(1, "Phone is required").max(50),
	email: z.string().min(1, "Email is required").email("Invalid email address"),
	// Settings - optional, defaults applied server-side
	timezone: z.string().max(50).optional(),
	currency: z.string().length(3, "Currency must be 3 characters").optional(),
});

/**
 * Update store - Form schema
 * All fields are strings for HTML input compatibility
 */
export const updateStoreFormSchema = z.object({
	name: z.string().min(1, "Store name is required").max(255).optional(),
	street: z.string().max(255).optional(),
	city: z.string().max(100).optional(),
	postalCode: z.string().max(20).optional(),
	country: z.string().max(100).optional(),
	phone: z.string().min(1, "Phone is required").max(50).optional(),
	email: z
		.string()
		.min(1, "Email is required")
		.email("Invalid email address")
		.optional(),
	timezone: z.string().max(50).optional(),
	currency: z.string().length(3, "Currency must be 3 characters").optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateStoreApiInput = z.infer<typeof createStoreApiSchema>;
export type UpdateStoreApiInput = z.infer<typeof updateStoreApiSchema>;
export type ToggleStoreActiveApiInput = z.infer<
	typeof toggleStoreActiveApiSchema
>;
export type UpdateStoreImageApiInput = z.infer<
	typeof updateStoreImageApiSchema
>;
export type GetStoreByIdApiInput = z.infer<typeof getStoreByIdApiSchema>;
export type GetStoreBySlugApiInput = z.infer<typeof getStoreBySlugApiSchema>;
export type DeleteStoreApiInput = z.infer<typeof deleteStoreApiSchema>;
export type CheckSlugAvailabilityApiInput = z.infer<
	typeof checkSlugAvailabilityApiSchema
>;

export type CreateStoreFormValues = z.infer<typeof createStoreFormSchema>;
export type UpdateStoreFormValues = z.infer<typeof updateStoreFormSchema>;

// Public procedure types
export type SearchStoresInput = z.infer<typeof searchStoresSchema>;
export type GetFeaturedStoresInput = z.infer<typeof getFeaturedStoresSchema>;
export type ResolveQRCodeInput = z.infer<typeof resolveQRCodeSchema>;
