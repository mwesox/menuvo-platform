/**
 * Service Point Schemas
 *
 * Zod schemas for service point-related tRPC procedures.
 * Following the Three Schema Rule:
 * - API schemas: Typed for API contracts (defined here)
 * - Form schemas: String-based for HTML inputs (defined in app features)
 * - Database schemas: Drizzle insert/select types (defined in @menuvo/db)
 */

import { z } from "zod";

// ============================================================================
// Service Point Types
// ============================================================================

/**
 * Service point type enum
 * - table: A dining table
 * - counter: A counter/bar position
 * - delivery: Delivery service point
 * - takeaway: Takeaway/pickup point
 */
export const servicePointTypes = [
	"table",
	"counter",
	"delivery",
	"takeaway",
] as const;
export type ServicePointType = (typeof servicePointTypes)[number];

// ============================================================================
// Service Point API Schemas
// ============================================================================

/**
 * Create service point - API schema
 */
export const createServicePointSchema = z.object({
	storeId: z.string().uuid(),
	code: z.string().min(1, "Code is required").max(100),
	name: z.string().min(1, "Name is required").max(255),
	type: z.enum(servicePointTypes).optional().default("table"),
	zone: z.string().max(100).optional(),
	description: z.string().optional(),
	attributes: z
		.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
		.optional(),
	displayOrder: z.number().int().optional(),
});

/**
 * Update service point - API schema
 */
export const updateServicePointSchema = z.object({
	id: z.string().uuid(),
	code: z.string().min(1).max(100).optional(),
	name: z.string().min(1).max(255).optional(),
	type: z.enum(servicePointTypes).optional(),
	zone: z.string().max(100).optional().nullable(),
	description: z.string().optional().nullable(),
	attributes: z
		.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
		.optional()
		.nullable(),
	displayOrder: z.number().int().optional(),
});

/**
 * Batch create service points - API schema
 */
export const batchCreateServicePointsSchema = z.object({
	storeId: z.string().uuid(),
	type: z.enum(servicePointTypes).optional().default("table"),
	prefix: z.string().min(1).max(10),
	startNumber: z.number().int().positive(),
	count: z.number().int().positive().max(100),
	zone: z.string().max(100).optional(),
});

/**
 * Toggle service point active status - API schema
 */
export const toggleServicePointSchema = z.object({
	id: z.string().uuid(),
	isActive: z.boolean(),
});

/**
 * Toggle zone active status - API schema
 */
export const toggleZoneActiveSchema = z.object({
	storeId: z.string().uuid(),
	zone: z.string().min(1),
	isActive: z.boolean(),
});

/**
 * Get service point by ID - API schema
 */
export const getServicePointByIdSchema = z.object({
	id: z.string().uuid(),
});

/**
 * List service points - API schema
 */
export const listServicePointsSchema = z.object({
	storeId: z.string().uuid(),
});

/**
 * Get zones - API schema
 */
export const getZonesSchema = z.object({
	storeId: z.string().uuid(),
});

/**
 * Get service point by code - API schema (public)
 */
export const getServicePointByCodeSchema = z.object({
	storeSlug: z.string(),
	code: z.string(),
});

/**
 * Get service point by short code - API schema (public)
 */
export const getServicePointByShortCodeSchema = z.object({
	shortCode: z.string(),
});

/**
 * Delete service point - API schema
 */
export const deleteServicePointSchema = z.object({
	id: z.string().uuid(),
});

// ============================================================================
// Service Point Form Schemas (for client-side validation)
// ============================================================================

/**
 * Service point - Form schema (strings)
 * Used for form validation in the console app
 */
export const servicePointFormSchema = z.object({
	code: z.string().min(1, "Code is required").max(100),
	name: z.string().min(1, "Name is required").max(255),
	type: z.enum(servicePointTypes).optional(),
	zone: z.string().max(100).optional(),
	description: z.string().optional(),
});

/**
 * Batch create service points - Form schema
 */
export const batchCreateServicePointsFormSchema = z.object({
	prefix: z.string().min(1, "Prefix is required").max(10),
	startNumber: z.string().regex(/^\d+$/, "Must be a positive number"),
	count: z.string().regex(/^\d+$/, "Must be a positive number"),
	type: z.enum(servicePointTypes).optional(),
	zone: z.string().max(100).optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateServicePointInput = z.infer<typeof createServicePointSchema>;
export type UpdateServicePointInput = z.infer<typeof updateServicePointSchema>;
export type BatchCreateServicePointsInput = z.infer<
	typeof batchCreateServicePointsSchema
>;
export type ToggleServicePointInput = z.infer<typeof toggleServicePointSchema>;
export type ToggleZoneActiveInput = z.infer<typeof toggleZoneActiveSchema>;
export type ServicePointFormValues = z.infer<typeof servicePointFormSchema>;
export type BatchCreateServicePointsFormValues = z.infer<
	typeof batchCreateServicePointsFormSchema
>;
