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

const extractedCategorySchema = aiMenuExtractionSchema.shape.categories.element;
const extractedItemSchema = extractedCategorySchema.shape.items.element;
const extractedOptionGroupSchema =
	aiMenuExtractionSchema.shape.optionGroups.element;
const extractedOptionChoiceSchema =
	extractedOptionGroupSchema.shape.choices.element;

export type ExtractedMenuData = AIMenuExtraction;
export type ExtractedCategory = z.infer<typeof extractedCategorySchema>;
export type ExtractedItem = z.infer<typeof extractedItemSchema>;
export type ExtractedOptionGroup = z.infer<typeof extractedOptionGroupSchema>;
export type ExtractedOptionChoice = z.infer<typeof extractedOptionChoiceSchema>;

/**
 * Selection item for applying changes.
 */
export const selectionItemSchema = z.object({
	type: z.enum(["category", "item", "optionGroup"]),
	extractedName: z.string(),
	action: z.enum(["apply", "skip"]),
	matchedEntityId: z.string().uuid().optional(),
});

/**
 * Server input for applying import changes.
 */
export const applyImportChangesSchema = z.object({
	jobId: z.string().uuid(),
	selections: z.array(selectionItemSchema),
});

export type ApplyImportChangesInput = z.infer<typeof applyImportChangesSchema>;

export const diffActionSchema = z.enum(["create", "update", "skip"]);

export type DiffAction = z.infer<typeof diffActionSchema>;

export const fieldChangeSchema = z.object({
	field: z.string(),
	oldValue: z.unknown(),
	newValue: z.unknown(),
});

export type FieldChange = z.infer<typeof fieldChangeSchema>;

export const itemComparisonSchema = z.object({
	extracted: extractedItemSchema,
	existingId: z.string().optional(),
	existingName: z.string().optional(),
	action: diffActionSchema,
	matchScore: z.number().min(0).max(1),
	changes: z.array(fieldChangeSchema).optional(),
});

export type ItemComparison = z.infer<typeof itemComparisonSchema>;

export const categoryComparisonSchema = z.object({
	extracted: extractedCategorySchema,
	existingId: z.string().optional(),
	existingName: z.string().optional(),
	action: diffActionSchema,
	matchScore: z.number().min(0).max(1),
	items: z.array(itemComparisonSchema),
});

export type CategoryComparison = z.infer<typeof categoryComparisonSchema>;

export const optionGroupComparisonSchema = z.object({
	extracted: extractedOptionGroupSchema,
	existingId: z.string().optional(),
	existingName: z.string().optional(),
	action: diffActionSchema,
	matchScore: z.number().min(0).max(1),
});

export type OptionGroupComparison = z.infer<typeof optionGroupComparisonSchema>;

export const comparisonSummarySchema = z.object({
	totalCategories: z.number().int(),
	newCategories: z.number().int(),
	updatedCategories: z.number().int(),
	totalItems: z.number().int(),
	newItems: z.number().int(),
	updatedItems: z.number().int(),
	totalOptionGroups: z.number().int(),
	newOptionGroups: z.number().int(),
	updatedOptionGroups: z.number().int(),
});

export type ComparisonSummary = z.infer<typeof comparisonSummarySchema>;

export const menuComparisonDataSchema = z.object({
	extractedMenu: aiMenuExtractionSchema,
	categories: z.array(categoryComparisonSchema),
	optionGroups: z.array(optionGroupComparisonSchema),
	summary: comparisonSummarySchema,
});

export type MenuComparisonData = z.infer<typeof menuComparisonDataSchema>;

export const importJobStatusResponseSchema = z.object({
	id: z.string().uuid(),
	status: z.enum(["PROCESSING", "READY", "COMPLETED", "FAILED"]),
	errorMessage: z.string().nullable(),
	comparisonData: menuComparisonDataSchema.nullable(),
});

export type ImportJobStatusResponse = z.infer<
	typeof importJobStatusResponseSchema
>;
