import { z } from "zod/v4";

// ============================================================================
// OPTION GROUP TYPE ENUM
// ============================================================================

export const optionGroupTypeSchema = z.enum([
	"single_select",
	"multi_select",
	"quantity_select",
]);
export type OptionGroupType = z.infer<typeof optionGroupTypeSchema>;

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
export type EntityTranslations = z.infer<typeof entityTranslationsSchema>;

const choiceTranslationsSchema = z.record(
	z.string(),
	z.object({
		name: z.string().optional(),
	}),
);
export type ChoiceTranslations = z.infer<typeof choiceTranslationsSchema>;

// ============================================================================
// OPTION GROUP FORM SCHEMA (Client-side validation)
// ============================================================================

export const optionGroupFormSchema = z.object({
	name: z
		.string()
		.min(2, "validation:optionGroupName.min")
		.max(100, "validation:optionGroupName.max"),
	description: z.string(),
	type: optionGroupTypeSchema,
	choices: z.array(
		z.object({
			id: z.string().optional(),
			name: z.string().min(1, "validation:choiceName.required"),
			priceModifier: z.string(),
		}),
	),
});
export type OptionGroupFormInput = z.infer<typeof optionGroupFormSchema>;
