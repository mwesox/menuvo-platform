/**
 * VAT Group Form Schemas
 *
 * Client-side validation schemas for VAT group forms.
 * These transform between user-friendly percentage display and
 * backend basis points storage (7% = 700 basis points).
 */

import { z } from "zod/v4";

// ============================================================================
// Conversion Helpers
// ============================================================================

/**
 * Convert user-friendly percentage string to basis points integer.
 * "7" → 700, "19" → 1900, "7.5" → 750
 */
export function percentageToBasisPoints(percentage: string): number {
	const num = Number.parseFloat(percentage);
	if (Number.isNaN(num)) return 0;
	return Math.round(num * 100);
}

/**
 * Convert basis points integer to user-friendly percentage string.
 * 700 → "7", 1900 → "19", 750 → "7.5"
 */
export function basisPointsToPercentage(basisPoints: number): string {
	const percentage = basisPoints / 100;
	// Remove trailing zeros for cleaner display
	return percentage % 1 === 0
		? percentage.toString()
		: percentage.toFixed(2).replace(/\.?0+$/, "");
}

/**
 * Format rate for display (e.g., "7%", "19%")
 */
export function formatVatRate(basisPoints: number): string {
	return `${basisPointsToPercentage(basisPoints)}%`;
}

// ============================================================================
// Form Schemas
// ============================================================================

/**
 * VAT group form schema for create/edit forms.
 *
 * Uses string for rate to support decimal input in the form.
 * The rate is converted to/from basis points when saving/loading.
 */
export const vatGroupFormSchema = z.object({
	/** Code identifier (e.g., "food", "alcohol", "standard") */
	code: z
		.string()
		.min(1, "validation:vatGroup.code.required")
		.max(50, "validation:vatGroup.code.max")
		.regex(/^[a-z0-9_-]+$/, "validation:vatGroup.code.format"),

	/** Display name (e.g., "Reduced Rate (Food)", "Standard Rate") */
	name: z
		.string()
		.min(1, "validation:vatGroup.name.required")
		.max(100, "validation:vatGroup.name.max"),

	/** VAT rate as percentage string (e.g., "7", "19", "7.5") */
	rate: z
		.string()
		.min(1, "validation:vatGroup.rate.required")
		.refine(
			(val) => {
				const num = Number.parseFloat(val);
				return !Number.isNaN(num) && num >= 0 && num <= 100;
			},
			{ message: "validation:vatGroup.rate.invalid" },
		),

	/** Optional description */
	description: z.string().max(500, "validation:vatGroup.description.max"),
});

export type VatGroupFormInput = z.infer<typeof vatGroupFormSchema>;

/**
 * Default values for a new VAT group form
 */
export const vatGroupFormDefaults: VatGroupFormInput = {
	code: "",
	name: "",
	rate: "",
	description: "",
};
