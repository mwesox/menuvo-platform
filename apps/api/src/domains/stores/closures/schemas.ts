/**
 * Closures Schemas
 *
 * Zod schemas for store closure procedures.
 * Store closures track temporary closures like holidays or renovations.
 *
 * Note: Dates are stored as strings (YYYY-MM-DD) in the database.
 */

import { z } from "zod";

// ============================================================================
// Date Validation Helper
// ============================================================================

/**
 * Regex for YYYY-MM-DD format
 */
const dateStringRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Custom date string validator that ensures valid YYYY-MM-DD format
 */
const dateString = z
	.string()
	.regex(dateStringRegex, "Date must be in YYYY-MM-DD format")
	.refine(
		(val) => {
			const date = new Date(val);
			return !Number.isNaN(date.getTime());
		},
		{ message: "Invalid date" },
	);

// ============================================================================
// API Schemas
// ============================================================================

/**
 * List closures for a store
 */
export const listClosuresSchema = z.object({
	storeId: z.string().uuid(),
});

export type ListClosuresInput = z.infer<typeof listClosuresSchema>;

/**
 * Get closure by ID
 */
export const getClosureByIdSchema = z.object({
	id: z.string().uuid(),
});

export type GetClosureByIdInput = z.infer<typeof getClosureByIdSchema>;

/**
 * Create a new store closure
 */
export const createClosureSchema = z
	.object({
		storeId: z.string().uuid(),
		startDate: dateString,
		endDate: dateString,
		reason: z.string().max(255).optional(),
	})
	.refine(
		(data) => {
			const start = new Date(data.startDate);
			const end = new Date(data.endDate);
			return end >= start;
		},
		{
			message: "End date must be on or after start date",
			path: ["endDate"],
		},
	);

export type CreateClosureInput = z.infer<typeof createClosureSchema>;

/**
 * Update an existing store closure
 */
export const updateClosureSchema = z
	.object({
		id: z.string().uuid(),
		startDate: dateString.optional(),
		endDate: dateString.optional(),
		reason: z.string().max(255).optional(),
	})
	.refine(
		(data) => {
			// Only validate if both dates are provided
			if (data.startDate && data.endDate) {
				const start = new Date(data.startDate);
				const end = new Date(data.endDate);
				return end >= start;
			}
			return true;
		},
		{
			message: "End date must be on or after start date",
			path: ["endDate"],
		},
	);

export type UpdateClosureInput = z.infer<typeof updateClosureSchema>;

/**
 * Delete a store closure
 */
export const deleteClosureSchema = z.object({
	id: z.string().uuid(),
});

export type DeleteClosureInput = z.infer<typeof deleteClosureSchema>;
