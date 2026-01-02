import { z } from "zod";
import type {
	ChoiceTranslations,
	EntityTranslations,
	OptionGroupType,
} from "@/db/schema.ts";

// ============================================================================
// OPTION GROUP TYPE ENUM
// ============================================================================

export const optionGroupTypeSchema = z.enum([
	"single_select",
	"multi_select",
	"quantity_select",
]);
export type OptionGroupTypeValue = z.infer<typeof optionGroupTypeSchema>;

// ============================================================================
// TRANSLATION SCHEMAS
// ============================================================================

export const entityTranslationsSchema = z.record(
	z.string(),
	z.object({
		name: z.string().optional(),
		description: z.string().optional(),
	}),
);

export const choiceTranslationsSchema = z.record(
	z.string(),
	z.object({
		name: z.string().optional(),
	}),
);

// ============================================================================
// OPTION GROUPS
// ============================================================================

export const createOptionGroupSchema = z.object({
	storeId: z.number().int().positive(),
	translations: entityTranslationsSchema.refine(
		(t) => Object.values(t).some((v) => v.name && v.name.length >= 2),
		"At least one language must have a name (min 2 characters)",
	),
	type: optionGroupTypeSchema.optional().default("multi_select"),
	isRequired: z.boolean().optional().default(false),
	minSelections: z.number().int().min(0).optional().default(0),
	maxSelections: z.number().int().min(1).nullable().optional(),
	numFreeOptions: z.number().int().min(0).optional().default(0),
	aggregateMinQuantity: z.number().int().min(0).nullable().optional(),
	aggregateMaxQuantity: z.number().int().min(1).nullable().optional(),
	displayOrder: z.number().int().min(0).optional(),
});

export const updateOptionGroupSchema = z.object({
	translations: entityTranslationsSchema.optional(),
	type: optionGroupTypeSchema.optional(),
	isRequired: z.boolean().optional(),
	minSelections: z.number().int().min(0).optional(),
	maxSelections: z.number().int().min(1).nullable().optional(),
	numFreeOptions: z.number().int().min(0).optional(),
	aggregateMinQuantity: z.number().int().min(0).nullable().optional(),
	aggregateMaxQuantity: z.number().int().min(1).nullable().optional(),
	displayOrder: z.number().int().min(0).optional(),
	isActive: z.boolean().optional(),
});

export type CreateOptionGroupInput = z.infer<typeof createOptionGroupSchema>;
export type UpdateOptionGroupInput = z.infer<typeof updateOptionGroupSchema>;

// ============================================================================
// CHOICE SCHEMA (reusable)
// ============================================================================

const choiceBaseSchema = z.object({
	id: z.number().int().positive().optional(), // undefined = new choice
	translations: choiceTranslationsSchema, // All languages stored in translations
	priceModifier: z.number().int(), // in cents
	isDefault: z.boolean().optional().default(false),
	minQuantity: z.number().int().min(0).optional().default(0),
	maxQuantity: z.number().int().min(1).nullable().optional(),
});

// ============================================================================
// SAVE OPTION GROUP WITH CHOICES (combined create/update)
// ============================================================================

// Note: isRequired is derived from minSelections > 0
export const saveOptionGroupWithChoicesSchema = z.object({
	optionGroupId: z.number().int().positive().optional(), // undefined = create, number = update
	storeId: z.number().int().positive(),
	translations: entityTranslationsSchema.refine(
		(t) => Object.values(t).some((v) => v.name && v.name.length >= 2),
		"At least one language must have a name (min 2 characters)",
	),
	type: optionGroupTypeSchema.optional().default("multi_select"),
	minSelections: z.number().int().min(0).optional().default(0),
	maxSelections: z.number().int().min(1).nullable().optional(),
	numFreeOptions: z.number().int().min(0).optional().default(0),
	aggregateMinQuantity: z.number().int().min(0).nullable().optional(),
	aggregateMaxQuantity: z.number().int().min(1).nullable().optional(),
	choices: z.array(choiceBaseSchema),
});
export type SaveOptionGroupWithChoicesInput = z.infer<
	typeof saveOptionGroupWithChoicesSchema
>;

// ============================================================================
// CLIENT-SIDE OPTION GROUP FORM SCHEMA
// ============================================================================

// Form schema for a specific language
export const optionGroupFormSchema = z.object({
	name: z
		.string()
		.min(2, "Option group name must be at least 2 characters")
		.max(100, "Option group name must be less than 100 characters"),
	description: z.string(),
	type: optionGroupTypeSchema,
	minSelections: z.number().int().min(0),
	maxSelections: z.number().int().min(1).nullable(),
	isUnlimited: z.boolean(),
	numFreeOptions: z.number().int().min(0),
	aggregateMinQuantity: z.number().int().min(0).nullable(),
	aggregateMaxQuantity: z.number().int().min(1).nullable(),
	choices: z.array(
		z.object({
			id: z.number().optional(),
			name: z.string().min(1, "Choice name is required"),
			priceModifier: z.number().int(), // in cents
			isDefault: z.boolean(),
			minQuantity: z.number().int().min(0),
			maxQuantity: z.number().int().min(1).nullable(),
		}),
	),
});
export type OptionGroupFormInput = z.infer<typeof optionGroupFormSchema>;

/**
 * Transform form input (for a specific language) to server schema format.
 */
export function optionGroupFormToServer(
	formData: OptionGroupFormInput,
	language: string,
	existingGroupTranslations?: EntityTranslations,
	existingChoices?: Array<{ id: number; translations: ChoiceTranslations }>,
): SaveOptionGroupWithChoicesInput {
	return {
		storeId: 0, // Must be set by caller
		translations: {
			...(existingGroupTranslations ?? {}),
			[language]: {
				name: formData.name,
				description: formData.description,
			},
		},
		type: formData.type,
		minSelections: formData.minSelections,
		maxSelections: formData.isUnlimited ? null : formData.maxSelections,
		numFreeOptions: formData.numFreeOptions,
		aggregateMinQuantity: formData.aggregateMinQuantity,
		aggregateMaxQuantity: formData.aggregateMaxQuantity,
		choices: formData.choices.map((choice) => {
			const existingChoice = existingChoices?.find((c) => c.id === choice.id);
			return {
				id: choice.id,
				translations: {
					...(existingChoice?.translations ?? {}),
					[language]: { name: choice.name },
				},
				priceModifier: choice.priceModifier,
				isDefault: choice.isDefault,
				minQuantity: choice.minQuantity,
				maxQuantity: choice.maxQuantity,
			};
		}),
	};
}

// ============================================================================
// TYPE CONSTRAINT HELPERS
// ============================================================================

/**
 * Derives selection constraints based on option group type.
 * - single_select: forces min=1, max=1
 * - multi_select: uses provided min/max
 * - quantity_select: uses aggregate min/max instead
 */
export function deriveSelectionsFromType(
	type: OptionGroupType,
	minSelections = 0,
	maxSelections: number | null = null,
): { minSelections: number; maxSelections: number | null } {
	if (type === "single_select") {
		return { minSelections: 1, maxSelections: 1 };
	}
	if (type === "quantity_select") {
		// quantity_select uses aggregate constraints, not selection constraints
		return { minSelections: 0, maxSelections: null };
	}
	// multi_select uses provided values
	return { minSelections, maxSelections };
}

/**
 * Validates type-specific constraints.
 * Returns array of error messages if validation fails.
 */
export function validateOptionGroupTypeConstraints(data: {
	type: OptionGroupType;
	aggregateMinQuantity?: number | null;
	aggregateMaxQuantity?: number | null;
}): string[] {
	const errors: string[] = [];

	if (data.type === "quantity_select") {
		if (
			data.aggregateMaxQuantity !== null &&
			data.aggregateMaxQuantity !== undefined &&
			data.aggregateMinQuantity !== null &&
			data.aggregateMinQuantity !== undefined &&
			data.aggregateMinQuantity > data.aggregateMaxQuantity
		) {
			errors.push("Aggregate min cannot exceed aggregate max");
		}
	}

	return errors;
}

// ============================================================================
// OPTION CHOICES
// ============================================================================

export const createOptionChoiceSchema = z.object({
	optionGroupId: z.number().int().positive(),
	translations: choiceTranslationsSchema.refine(
		(t) => Object.values(t).some((v) => v.name && v.name.length >= 1),
		"At least one language must have a name",
	),
	priceModifier: z.number().int().default(0),
	displayOrder: z.number().int().min(0).default(0),
	isDefault: z.boolean().optional().default(false),
	minQuantity: z.number().int().min(0).optional().default(0),
	maxQuantity: z.number().int().min(1).nullable().optional(),
});

export const updateOptionChoiceSchema = z.object({
	translations: choiceTranslationsSchema.optional(),
	priceModifier: z.number().int().optional(),
	displayOrder: z.number().int().min(0).optional(),
	isDefault: z.boolean().optional(),
	isAvailable: z.boolean().optional(),
	minQuantity: z.number().int().min(0).optional(),
	maxQuantity: z.number().int().min(1).nullable().optional(),
});

export type CreateOptionChoiceInput = z.infer<typeof createOptionChoiceSchema>;
export type UpdateOptionChoiceInput = z.infer<typeof updateOptionChoiceSchema>;

// ============================================================================
// ITEM OPTIONS ASSIGNMENT
// ============================================================================

export const updateItemOptionsSchema = z.object({
	itemId: z.number().int().positive(),
	optionGroupIds: z.array(z.number().int().positive()),
});

export type UpdateItemOptionsInput = z.infer<typeof updateItemOptionsSchema>;
