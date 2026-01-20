/**
 * Option Schemas
 *
 * API and Form schemas for option-related operations.
 * Following the Three Schema Rule:
 * - Form schemas: String-based for HTML inputs (used in client apps)
 * - API schemas: Typed for API contracts (used in tRPC procedures)
 */

import { z } from "zod";

// ============================================================================
// OPTION GROUP TYPE ENUM
// ============================================================================

/**
 * Option group types matching database enum.
 * - single_select: Radio buttons, customer must choose exactly one (e.g., Size)
 * - multi_select: Checkboxes, customer can choose 0 to N (e.g., Toppings)
 * - quantity_select: Quantity pickers, customer picks quantities (e.g., "Pick 3 donuts")
 */
export const optionGroupTypeSchema = z.enum([
	"single_select",
	"multi_select",
	"quantity_select",
]);

export type OptionGroupType = z.infer<typeof optionGroupTypeSchema>;

// ============================================================================
// TRANSLATION SCHEMAS
// ============================================================================

/**
 * Entity translation schema for items with name and description.
 * Matches EntityTranslations from @menuvo/db
 */
export const entityTranslationSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
});

export const entityTranslationsSchema = z.record(
	z.string(),
	entityTranslationSchema,
);

export type EntityTranslation = z.infer<typeof entityTranslationSchema>;
export type EntityTranslations = z.infer<typeof entityTranslationsSchema>;

/**
 * Choice translation schema for options with only name.
 * Matches ChoiceTranslations from @menuvo/db
 */
export const choiceTranslationSchema = z.object({
	name: z.string().optional(),
});

export const choiceTranslationsSchema = z.record(
	z.string(),
	choiceTranslationSchema,
);

export type ChoiceTranslation = z.infer<typeof choiceTranslationSchema>;
export type ChoiceTranslations = z.infer<typeof choiceTranslationsSchema>;

// ============================================================================
// API SCHEMAS - OPTION GROUPS
// ============================================================================

/**
 * List option groups - API schema
 */
export const listOptionGroupsSchema = z.object({
	storeId: z.string().uuid("Invalid store ID"),
});

/**
 * Get option group by ID - API schema
 */
export const getOptionGroupSchema = z.object({
	optionGroupId: z.string().uuid("Invalid option group ID"),
});

/**
 * Create option group - API schema
 */
export const createOptionGroupSchema = z.object({
	storeId: z.string().uuid("Invalid store ID"),
	translations: entityTranslationsSchema,
	type: optionGroupTypeSchema.default("multi_select"),
	minSelections: z.number().int().min(0).default(0),
	maxSelections: z.number().int().min(1).nullable().default(null),
	isRequired: z.boolean().default(false),
	numFreeOptions: z.number().int().min(0).default(0),
	aggregateMinQuantity: z.number().int().min(0).nullable().default(null),
	aggregateMaxQuantity: z.number().int().min(1).nullable().default(null),
	displayOrder: z.number().int().optional(),
});

/**
 * Update option group - API schema
 */
export const updateOptionGroupSchema = z
	.object({
		optionGroupId: z.string().uuid("Invalid option group ID"),
		translations: entityTranslationsSchema.optional(),
		type: optionGroupTypeSchema.optional(),
		minSelections: z.number().int().min(0).optional(),
		maxSelections: z.number().int().min(1).nullable().optional(),
		isRequired: z.boolean().optional(),
		numFreeOptions: z.number().int().min(0).optional(),
		aggregateMinQuantity: z.number().int().min(0).nullable().optional(),
		aggregateMaxQuantity: z.number().int().min(1).nullable().optional(),
		displayOrder: z.number().int().optional(),
	})
	.refine((data) => Object.keys(data).length > 1, {
		message: "At least one field to update is required",
	});

/**
 * Toggle option group active - API schema
 */
export const toggleOptionGroupActiveSchema = z.object({
	optionGroupId: z.string().uuid("Invalid option group ID"),
	isActive: z.boolean(),
});

/**
 * Delete option group - API schema
 */
export const deleteOptionGroupSchema = z.object({
	optionGroupId: z.string().uuid("Invalid option group ID"),
});

// ============================================================================
// API SCHEMAS - OPTION CHOICES
// ============================================================================

/**
 * List option choices - API schema
 */
export const listOptionChoicesSchema = z.object({
	optionGroupId: z.string().uuid("Invalid option group ID"),
});

/**
 * Create option choice - API schema
 */
export const createOptionChoiceSchema = z.object({
	optionGroupId: z.string().uuid("Invalid option group ID"),
	translations: choiceTranslationsSchema,
	priceModifier: z.number().default(0),
	isDefault: z.boolean().default(false),
	minQuantity: z.number().int().min(0).default(0),
	maxQuantity: z.number().int().min(1).nullable().default(null),
	displayOrder: z.number().int().optional(),
});

/**
 * Update option choice - API schema
 */
export const updateOptionChoiceSchema = z
	.object({
		optionChoiceId: z.string().uuid("Invalid option choice ID"),
		translations: choiceTranslationsSchema.optional(),
		priceModifier: z.number().optional(),
		isDefault: z.boolean().optional(),
		minQuantity: z.number().int().min(0).optional(),
		maxQuantity: z.number().int().min(1).nullable().optional(),
		displayOrder: z.number().int().optional(),
	})
	.refine((data) => Object.keys(data).length > 1, {
		message: "At least one field to update is required",
	});

/**
 * Toggle option choice available - API schema
 */
export const toggleOptionChoiceAvailableSchema = z.object({
	optionChoiceId: z.string().uuid("Invalid option choice ID"),
	isAvailable: z.boolean(),
});

/**
 * Delete option choice - API schema
 */
export const deleteOptionChoiceSchema = z.object({
	optionChoiceId: z.string().uuid("Invalid option choice ID"),
});

// ============================================================================
// API SCHEMAS - ITEM OPTIONS
// ============================================================================

/**
 * Get item options - API schema
 */
export const getItemOptionsSchema = z.object({
	itemId: z.string().uuid("Invalid item ID"),
});

/**
 * Update item options - API schema
 */
export const updateItemOptionsSchema = z.object({
	itemId: z.string().uuid("Invalid item ID"),
	optionGroupIds: z.array(z.string().uuid("Invalid option group ID")),
});

// ============================================================================
// API SCHEMAS - SAVE GROUP WITH CHOICES (ATOMIC)
// ============================================================================

/**
 * Choice input for saveGroupWithChoices
 */
export const choiceInputSchema = z.object({
	id: z.string().uuid().optional(),
	translations: choiceTranslationsSchema,
	priceModifier: z.number().default(0),
	isDefault: z.boolean().default(false),
	minQuantity: z.number().int().min(0).default(0),
	maxQuantity: z.number().int().min(1).nullable().default(null),
});

/**
 * Save option group with choices atomically - API schema
 */
export const saveOptionGroupWithChoicesSchema = z.object({
	optionGroupId: z.string().uuid().optional(),
	storeId: z.string().uuid("Invalid store ID"),
	translations: entityTranslationsSchema,
	type: optionGroupTypeSchema.default("multi_select"),
	minSelections: z.number().int().min(0).optional(),
	maxSelections: z.number().int().min(1).nullable().optional(),
	numFreeOptions: z.number().int().min(0).default(0),
	aggregateMinQuantity: z.number().int().min(0).nullable().optional(),
	aggregateMaxQuantity: z.number().int().min(1).nullable().optional(),
	choices: z.array(choiceInputSchema),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ListOptionGroupsInput = z.infer<typeof listOptionGroupsSchema>;
export type GetOptionGroupInput = z.infer<typeof getOptionGroupSchema>;
export type CreateOptionGroupInput = z.infer<typeof createOptionGroupSchema>;
export type UpdateOptionGroupInput = z.infer<typeof updateOptionGroupSchema>;
export type ToggleOptionGroupActiveInput = z.infer<
	typeof toggleOptionGroupActiveSchema
>;
export type DeleteOptionGroupInput = z.infer<typeof deleteOptionGroupSchema>;

export type ListOptionChoicesInput = z.infer<typeof listOptionChoicesSchema>;
export type CreateOptionChoiceInput = z.infer<typeof createOptionChoiceSchema>;
export type UpdateOptionChoiceInput = z.infer<typeof updateOptionChoiceSchema>;
export type ToggleOptionChoiceAvailableInput = z.infer<
	typeof toggleOptionChoiceAvailableSchema
>;
export type DeleteOptionChoiceInput = z.infer<typeof deleteOptionChoiceSchema>;

export type GetItemOptionsInput = z.infer<typeof getItemOptionsSchema>;
export type UpdateItemOptionsInput = z.infer<typeof updateItemOptionsSchema>;

export type ChoiceInput = z.infer<typeof choiceInputSchema>;
export type SaveOptionGroupWithChoicesInput = z.infer<
	typeof saveOptionGroupWithChoicesSchema
>;

// ============================================================================
// PUBLIC TYPES (for console/admin use)
// ============================================================================

/**
 * Public option choice type
 * Represents an option choice with all its fields from the database
 */
export type PublicOptionChoice = {
	id: string;
	optionGroupId: string;
	priceModifier: number;
	displayOrder: string;
	isAvailable: boolean;
	isDefault: boolean;
	minQuantity: number;
	maxQuantity: number | null;
	translations: ChoiceTranslations;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Public option group type
 * Represents an option group with all its fields and relations from the database
 */
export type PublicOptionGroup = {
	id: string;
	storeId: string;
	type: "single_select" | "multi_select" | "quantity_select";
	isRequired: boolean;
	minSelections: number;
	maxSelections: number | null;
	numFreeOptions: number;
	aggregateMinQuantity: number | null;
	aggregateMaxQuantity: number | null;
	displayOrder: string;
	isActive: boolean;
	translations: EntityTranslations;
	createdAt: Date;
	updatedAt: Date;
	choices?: PublicOptionChoice[];
	itemCount?: number;
};
