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
 */
export const createStoreApiSchema = z.object({
	name: z.string().min(1, "Store name is required").max(255),
	street: z.string().max(255).optional(),
	city: z.string().max(100).optional(),
	postalCode: z.string().max(20).optional(),
	country: z.string().max(100).optional(),
	phone: z.string().max(50).optional(),
	email: z.string().email("Invalid email address").optional(),
	timezone: z.string().max(50).optional(),
	currency: z.string().length(3, "Currency must be 3 characters").optional(),
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
	phone: z.string().max(50).optional(),
	email: z.string().email("Invalid email address").optional().nullable(),
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

// ============================================================================
// FORM SCHEMAS (Strings - used in client forms)
// ============================================================================

/**
 * Create store - Form schema
 * All fields are strings for HTML input compatibility
 */
export const createStoreFormSchema = z.object({
	name: z.string().min(1, "Store name is required").max(255),
	street: z.string().max(255).optional(),
	city: z.string().max(100).optional(),
	postalCode: z.string().max(20).optional(),
	country: z.string().max(100).optional(),
	phone: z.string().max(50).optional(),
	email: z.string().email("Invalid email address").optional().or(z.literal("")),
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
	phone: z.string().max(50).optional(),
	email: z.string().email("Invalid email address").optional().or(z.literal("")),
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

export type CreateStoreFormValues = z.infer<typeof createStoreFormSchema>;
export type UpdateStoreFormValues = z.infer<typeof updateStoreFormSchema>;
