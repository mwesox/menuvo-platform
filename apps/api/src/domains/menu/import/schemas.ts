/**
 * Import Schemas
 *
 * Zod schemas for menu import-related API inputs.
 * Used for importing menus from external files (xlsx, csv, json, etc.)
 */

import { z } from "zod";

// ============================================================================
// Enums
// ============================================================================

/**
 * Entity types that can be imported
 */
export const importEntityTypeEnum = z.enum(["category", "item", "optionGroup"]);

/**
 * Actions that can be taken for each imported entity
 */
export const importActionEnum = z.enum(["apply", "skip"]);

// ============================================================================
// API Schemas
// ============================================================================

/**
 * Get import job status - API schema
 */
export const getImportJobStatusSchema = z.object({
	jobId: z.string().uuid("Invalid job ID"),
});

/**
 * Selection for a single imported entity
 */
export const importSelectionSchema = z.object({
	type: importEntityTypeEnum,
	extractedName: z.string().min(1, "Extracted name is required"),
	action: importActionEnum,
	matchedEntityId: z.string().uuid().optional(),
});

/**
 * Apply import changes - API schema
 * Applies selected changes from an import job
 */
export const applyImportChangesSchema = z.object({
	jobId: z.string().uuid("Invalid job ID"),
	storeId: z.string().uuid("Invalid store ID"),
	selections: z
		.array(importSelectionSchema)
		.min(1, "At least one selection is required"),
});

/**
 * Import job status response schema
 */
export const importJobStatusSchema = z.object({
	id: z.string().uuid(),
	storeId: z.string().uuid(),
	originalFilename: z.string(),
	fileType: z.string(),
	status: z.enum(["PROCESSING", "READY", "COMPLETED", "FAILED"]),
	errorMessage: z.string().nullable(),
	comparisonData: z.any().nullable(),
	createdAt: z.date(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type ImportEntityType = z.infer<typeof importEntityTypeEnum>;
export type ImportAction = z.infer<typeof importActionEnum>;
export type GetImportJobStatusInput = z.infer<typeof getImportJobStatusSchema>;
export type ImportSelection = z.infer<typeof importSelectionSchema>;
export type ApplyImportChangesInput = z.infer<typeof applyImportChangesSchema>;
export type ImportJobStatus = z.infer<typeof importJobStatusSchema>;
