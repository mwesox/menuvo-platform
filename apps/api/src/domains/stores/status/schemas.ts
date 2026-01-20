/**
 * Store Status Schemas
 *
 * Zod schemas for store status API operations.
 */

import { z } from "zod";

/**
 * Get status by slug - API schema
 */
export const getStatusBySlugSchema = z.object({
	slug: z.string().min(1),
});

export type GetStatusBySlugInput = z.infer<typeof getStatusBySlugSchema>;

/**
 * Get available pickup slots - API schema
 */
export const getAvailablePickupSlotsSchema = z.object({
	slug: z.string().min(1),
	date: z.string().optional(), // ISO date string (YYYY-MM-DD)
	languageCode: z.string().optional(), // Language code (e.g., "de", "en")
});

export type GetAvailablePickupSlotsInput = z.infer<
	typeof getAvailablePickupSlotsSchema
>;
