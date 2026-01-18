/**
 * VAT Schemas
 *
 * Zod schemas for VAT-related API inputs.
 */

import { z } from "zod";

// ============================================================================
// API Schemas
// ============================================================================

/**
 * Create VAT group - API schema
 */
export const createVatGroupSchema = z.object({
	/** Code for the group (e.g., "food", "drinks") */
	code: z
		.string()
		.min(1, "Code is required")
		.max(50, "Code must be 50 characters or less")
		.toLowerCase(),
	/** Display name */
	name: z
		.string()
		.min(1, "Name is required")
		.max(100, "Name must be 100 characters or less"),
	/** Optional description */
	description: z.string().max(500).optional(),
	/** VAT rate in basis points (700 = 7%, 1900 = 19%) */
	rate: z.number().int().min(0).max(10000),
	/** Display order for UI */
	displayOrder: z.number().int().min(0).optional(),
});

/**
 * Update VAT group - API schema
 */
export const updateVatGroupSchema = z.object({
	/** VAT group ID */
	id: z.string().uuid("Invalid VAT group ID"),
	/** Display name */
	name: z.string().min(1).max(100).optional(),
	/** Optional description */
	description: z.string().max(500).nullish(),
	/** VAT rate in basis points */
	rate: z.number().int().min(0).max(10000).optional(),
	/** Display order for UI */
	displayOrder: z.number().int().min(0).optional(),
});

/**
 * Delete VAT group - API schema
 */
export const deleteVatGroupSchema = z.object({
	/** VAT group ID */
	id: z.string().uuid("Invalid VAT group ID"),
});

/**
 * Get VAT group by ID - API schema
 */
export const getVatGroupSchema = z.object({
	/** VAT group ID */
	id: z.string().uuid("Invalid VAT group ID"),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateVatGroupInput = z.infer<typeof createVatGroupSchema>;
export type UpdateVatGroupInput = z.infer<typeof updateVatGroupSchema>;
export type DeleteVatGroupInput = z.infer<typeof deleteVatGroupSchema>;
export type GetVatGroupInput = z.infer<typeof getVatGroupSchema>;
