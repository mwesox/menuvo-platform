/**
 * Service Point Schemas
 *
 * Zod schemas for service point-related tRPC procedures.
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
