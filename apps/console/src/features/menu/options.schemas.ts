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
