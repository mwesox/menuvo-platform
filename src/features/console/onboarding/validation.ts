import { z } from "zod";

// ============================================================================
// FIELD-LEVEL SCHEMAS (for onBlur validation)
// ============================================================================

// Helper to create a TanStack Form validator from a Zod schema
export function zodValidator<T>(schema: z.ZodType<T>) {
	return ({ value }: { value: T }) => {
		const result = schema.safeParse(value);
		if (!result.success) {
			// Zod v4 uses .issues instead of .errors
			return result.error.issues[0]?.message;
		}
		return undefined;
	};
}

// Merchant field schemas
export const merchantNameSchema = z
	.string()
	.min(4, "validation:businessName.min")
	.max(100, "validation:businessName.max");

export const ownerNameSchema = z
	.string()
	.min(2, "validation:ownerName.min")
	.max(100, "validation:ownerName.max");

export const merchantEmailSchema = z.string().email("validation:email.invalid");

// German phone: required, must be valid format
// Accepts: +49..., 0..., with or without spaces/dashes
const germanPhoneRegex = /^(\+49|0)[1-9][0-9\s\-/]{6,14}$/;
export const merchantPhoneSchema = z
	.string()
	.min(1, "validation:phone.required")
	.refine(
		(val) => germanPhoneRegex.test(val.replace(/\s/g, "")),
		"validation:phone.invalid",
	);

// Store field schemas
export const storeNameSchema = z
	.string()
	.min(2, "validation:storeName.min")
	.max(100, "validation:storeName.max");

export const storeStreetSchema = z
	.string()
	.min(3, "validation:street.required")
	.max(200, "validation:street.max");

// German city name: letters, spaces, hyphens, umlauts
const cityNameRegex = /^[a-zA-ZäöüÄÖÜß\s\-'.]+$/;
export const storeCitySchema = z
	.string()
	.min(2, "validation:city.required")
	.max(100, "validation:city.max")
	.refine((val) => cityNameRegex.test(val), "validation:city.invalid");

// German postal code: exactly 5 digits
const germanPostalCodeRegex = /^[0-9]{5}$/;
export const storePostalCodeSchema = z
	.string()
	.refine(
		(val) => germanPostalCodeRegex.test(val),
		"validation:postalCode.invalid",
	);

export const storeCountrySchema = z
	.string()
	.min(2, "validation:country.required")
	.max(100, "validation:country.max");

// ============================================================================
// STEP-SPECIFIC FORM SCHEMAS (for step validation)
// ============================================================================

// Step 1: Merchant Details
export const merchantStepFormSchema = z.object({
	name: merchantNameSchema,
	ownerName: ownerNameSchema,
	email: merchantEmailSchema,
	phone: merchantPhoneSchema,
});
export type MerchantStepFormInput = z.infer<typeof merchantStepFormSchema>;

// Step 2: Store Details
export const storeStepFormSchema = z.object({
	name: storeNameSchema,
	street: storeStreetSchema,
	city: storeCitySchema,
	postalCode: storePostalCodeSchema,
	country: storeCountrySchema,
});
export type StoreStepFormInput = z.infer<typeof storeStepFormSchema>;

// ============================================================================
// FULL SCHEMAS (composed from step schemas)
// ============================================================================

// Server schema - for server function input validation
export const onboardingSchema = z.object({
	merchant: merchantStepFormSchema.extend({
		phone: z.string().optional(),
	}),
	store: storeStepFormSchema.extend({
		timezone: z.string().default("Europe/Berlin"),
		currency: z.enum(["EUR", "USD", "GBP", "CHF"]).default("EUR"),
	}),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

// Form schema - for client-side form validation
export const onboardingFormSchema = z.object({
	merchant: merchantStepFormSchema,
	store: storeStepFormSchema,
});
export type OnboardingFormInput = z.infer<typeof onboardingFormSchema>;

export const currencies = [
	{ value: "EUR", label: "Euro (€)" },
	{ value: "USD", label: "US Dollar ($)" },
	{ value: "GBP", label: "British Pound (£)" },
	{ value: "CHF", label: "Swiss Franc (CHF)" },
] as const;

export const timezones = [
	{ value: "Europe/Berlin", label: "Berlin (CET)" },
	{ value: "Europe/London", label: "London (GMT)" },
	{ value: "Europe/Paris", label: "Paris (CET)" },
	{ value: "Europe/Zurich", label: "Zurich (CET)" },
	{ value: "America/New_York", label: "New York (EST)" },
	{ value: "America/Los_Angeles", label: "Los Angeles (PST)" },
] as const;
