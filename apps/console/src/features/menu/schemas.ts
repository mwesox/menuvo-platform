import { z } from "zod/v4";

// Availability schedule form schema
const availabilityScheduleFormSchema = z.object({
	enabled: z.boolean(),
	timeRange: z
		.object({
			startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
			endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
		})
		.optional(),
	daysOfWeek: z
		.array(
			z.enum([
				"monday",
				"tuesday",
				"wednesday",
				"thursday",
				"friday",
				"saturday",
				"sunday",
			]),
		)
		.optional(),
	dateRange: z
		.object({
			startDate: z.string().date(),
			endDate: z.string().date(),
		})
		.optional(),
});

// Client-side category form schema (for a specific language)
export const categoryFormSchema = z.object({
	name: z
		.string()
		.min(2, "validation:categoryName.min")
		.max(100, "validation:categoryName.max"),
	description: z.string(),
	/** Default VAT group ID for items in this category (optional) */
	defaultVatGroupId: z.string().nullable(),
	/** Availability schedule configuration */
	availabilitySchedule: availabilityScheduleFormSchema,
});
export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

// Translation input schema (name required for API writes)
export const entityTranslationsInputSchema = z.record(
	z.string(),
	z.object({
		name: z.string().min(1, "Name is required"),
		description: z.string().optional(),
	}),
);
export type EntityTranslationsInput = z.infer<
	typeof entityTranslationsInputSchema
>;

// ============================================================================
// ITEMS
// ============================================================================

// Client-side item form schema (for a specific language, with price as string)
export const itemFormSchema = z.object({
	categoryId: z.string().min(1, "validation:itemCategory.required"),
	name: z
		.string()
		.min(2, "validation:itemName.min")
		.max(100, "validation:itemName.max"),
	description: z.string(),
	price: z.string().min(1, "validation:itemPrice.required"),
	imageUrl: z.string(),
	allergens: z.array(z.string()),
	kitchenName: z.string().max(50),
	/** VAT group ID for this item (null = inherit from category) */
	vatGroupId: z.string().nullable(),
});
export type ItemFormInput = z.infer<typeof itemFormSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Loose input type for existing translations (from DB, may have optional name)
type LooseTranslations = Record<
	string,
	{ name?: string; description?: string } | undefined
>;

/**
 * Transform form input (name, description for a specific language)
 * into translations JSONB format for server.
 */
export function formToTranslations(
	formData: { name: string; description: string },
	language: string,
	existingTranslations?: LooseTranslations,
): EntityTranslationsInput {
	// Start with empty object and only include translations that have valid names
	const result: EntityTranslationsInput = {};

	// Add existing translations that have valid names
	if (existingTranslations) {
		for (const [lang, translation] of Object.entries(existingTranslations)) {
			if (translation?.name) {
				result[lang] = {
					name: translation.name,
					description: translation.description,
				};
			}
		}
	}

	// Add/update the current language translation
	result[language] = {
		name: formData.name,
		description: formData.description,
	};

	return result;
}

/**
 * Extract form values from translations for a specific language.
 */
export function translationsToForm(
	translations: LooseTranslations | null,
	language: string,
): { name: string; description: string } {
	const t = translations?.[language];
	return {
		name: t?.name ?? "",
		description: t?.description ?? "",
	};
}
