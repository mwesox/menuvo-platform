import { z } from "zod/v4";

/**
 * Allowed file types for menu import.
 */
export const allowedFileTypes = ["xlsx", "csv", "json", "md", "txt"] as const;
export type AllowedFileType = (typeof allowedFileTypes)[number];

/**
 * AI extraction output schema - used with generateStructured().
 */
export const aiMenuExtractionSchema = z.object({
	categories: z.array(
		z.object({
			name: z.string().min(1),
			description: z.string().optional(),
			items: z.array(
				z.object({
					name: z.string().min(1),
					description: z.string().optional(),
					price: z.number().min(0), // In cents
					allergens: z.array(z.string()).optional(),
					categoryName: z.string().min(1),
				}),
			),
		}),
	),
	optionGroups: z.array(
		z.object({
			name: z.string().min(1),
			description: z.string().optional(),
			type: z.enum(["single_select", "multi_select", "quantity_select"]),
			isRequired: z.boolean(),
			choices: z.array(
				z.object({
					name: z.string().min(1),
					priceModifier: z.number(),
				}),
			),
			appliesTo: z.array(z.string()),
		}),
	),
	confidence: z.number().min(0).max(1),
});

export type AIMenuExtraction = z.infer<typeof aiMenuExtractionSchema>;

/**
 * Server input for getting job status.
 */
export const getImportJobStatusSchema = z.object({
	jobId: z.string().uuid(),
});

/**
 * Selection item for applying changes.
 */
export const selectionItemSchema = z.object({
	type: z.enum(["category", "item", "optionGroup"]),
	extractedName: z.string(),
	action: z.enum(["apply", "skip"]),
});

/**
 * Server input for applying import changes.
 */
export const applyImportChangesSchema = z.object({
	jobId: z.string().uuid(),
	selections: z.array(selectionItemSchema),
});

export type ApplyImportChangesInput = z.infer<typeof applyImportChangesSchema>;
