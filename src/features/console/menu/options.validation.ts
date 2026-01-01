import { z } from "zod";

// Option Groups
export const createOptionGroupSchema = z.object({
	storeId: z.number().int().positive(),
	name: z
		.string()
		.min(2, "Option group name must be at least 2 characters")
		.max(100, "Option group name must be less than 100 characters"),
	description: z.string().optional(),
	isRequired: z.boolean().optional().default(false),
	minSelections: z.number().int().min(0).optional().default(0),
	maxSelections: z.number().int().min(1).nullable().optional(),
	displayOrder: z.number().int().min(0).optional(),
});

export const updateOptionGroupSchema = createOptionGroupSchema
	.omit({ storeId: true })
	.partial();

export type CreateOptionGroupInput = z.infer<typeof createOptionGroupSchema>;
export type UpdateOptionGroupInput = z.infer<typeof updateOptionGroupSchema>;

// Client-side option group form schema
export const optionGroupFormSchema = z.object({
	name: z
		.string()
		.min(2, "Option group name must be at least 2 characters")
		.max(100, "Option group name must be less than 100 characters"),
	description: z.string(),
	isRequired: z.boolean(),
	minSelections: z.number().int().min(0),
	maxSelections: z.number().int().min(1).nullable(),
	isUnlimited: z.boolean(),
	choices: z.array(
		z.object({
			id: z.number().optional(),
			name: z.string().min(1, "Choice name is required"),
			priceModifier: z.string(),
		}),
	),
});
export type OptionGroupFormInput = z.infer<typeof optionGroupFormSchema>;

// Option Choices
export const createOptionChoiceSchema = z.object({
	optionGroupId: z.number().int().positive(),
	name: z
		.string()
		.min(2, "Option choice name must be at least 2 characters")
		.max(100, "Option choice name must be less than 100 characters"),
	priceModifier: z.number().int().default(0),
	displayOrder: z.number().int().min(0).default(0),
});

export const updateOptionChoiceSchema = createOptionChoiceSchema
	.omit({ optionGroupId: true })
	.partial();

export type CreateOptionChoiceInput = z.infer<typeof createOptionChoiceSchema>;
export type UpdateOptionChoiceInput = z.infer<typeof updateOptionChoiceSchema>;

// Item Options Assignment
export const updateItemOptionsSchema = z.object({
	itemId: z.number().int().positive(),
	optionGroupIds: z.array(z.number().int().positive()),
});

export type UpdateItemOptionsInput = z.infer<typeof updateItemOptionsSchema>;
