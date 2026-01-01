import { z } from "zod";

// URL-safe code pattern (lowercase letters, numbers, hyphens)
const codePattern = /^[a-z0-9-]+$/;

// ============================================================================
// SERVICE POINT SCHEMAS
// ============================================================================

/**
 * Schema for creating a new service point.
 * Used by server functions with storeId from context.
 */
export const createServicePointSchema = z.object({
	storeId: z.number().int().positive(),
	code: z
		.string()
		.min(1, "Code is required")
		.max(100, "Code must be less than 100 characters")
		.regex(
			codePattern,
			"Code can only contain lowercase letters, numbers, and hyphens",
		),
	name: z
		.string()
		.min(1, "Name is required")
		.max(255, "Name must be less than 255 characters"),
	type: z.string().max(100).optional(),
	description: z.string().optional(),
	attributes: z
		.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
		.optional(),
	displayOrder: z.number().int().optional(),
});

/**
 * Schema for updating an existing service point.
 * All fields except storeId are optional.
 */
export const updateServicePointSchema = createServicePointSchema
	.omit({ storeId: true })
	.partial();

/**
 * Form schema for client-side validation.
 * Used with TanStack Form, matches form input types.
 */
export const servicePointFormSchema = z.object({
	code: z
		.string()
		.min(1, "Code is required")
		.max(100, "Code must be less than 100 characters")
		.regex(
			codePattern,
			"Code can only contain lowercase letters, numbers, and hyphens",
		),
	name: z
		.string()
		.min(1, "Name is required")
		.max(255, "Name must be less than 255 characters"),
	type: z.string().max(100),
	description: z.string(),
	attributes: z.record(
		z.string(),
		z.union([z.string(), z.number(), z.boolean()]),
	),
});

// ============================================================================
// SCAN TRACKING SCHEMAS
// ============================================================================

/**
 * Schema for recording a QR code scan.
 * Used when a customer scans a service point QR code.
 */
export const recordScanSchema = z.object({
	storeSlug: z.string(),
	servicePointCode: z.string(),
	userAgent: z.string().optional(),
	referrer: z.string().optional(),
});

/**
 * Schema for querying scan statistics.
 */
export const scanStatsQuerySchema = z.object({
	storeId: z.number().int().positive(),
	days: z.number().int().min(1).max(365).optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CreateServicePointInput = z.infer<typeof createServicePointSchema>;
export type UpdateServicePointInput = z.infer<typeof updateServicePointSchema>;
export type ServicePointFormInput = z.infer<typeof servicePointFormSchema>;
export type RecordScanInput = z.infer<typeof recordScanSchema>;
export type ScanStatsQueryInput = z.infer<typeof scanStatsQuerySchema>;
