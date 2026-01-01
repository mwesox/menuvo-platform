import { z } from "zod";

// Re-export shared constants from onboarding
export {
	currencies,
	languages,
	timezones,
} from "@/features/onboarding/validation";

// ============================================================================
// CONSTANTS
// ============================================================================

export const countries = [
	{ value: "DE", label: "Germany" },
	{ value: "AT", label: "Austria" },
	{ value: "CH", label: "Switzerland" },
	{ value: "NL", label: "Netherlands" },
	{ value: "BE", label: "Belgium" },
	{ value: "FR", label: "France" },
	{ value: "IT", label: "Italy" },
	{ value: "ES", label: "Spain" },
	{ value: "GB", label: "United Kingdom" },
	{ value: "US", label: "United States" },
] as const;

// ============================================================================
// MERCHANT SCHEMAS
// ============================================================================

export const merchantGeneralSchema = z.object({
	name: z
		.string()
		.min(2, "Business name must be at least 2 characters")
		.max(100, "Business name must be less than 100 characters"),
	email: z.string().email("Please enter a valid email address"),
	phone: z.string(),
});
export type MerchantGeneralInput = z.infer<typeof merchantGeneralSchema>;

export const merchantLanguageSchema = z.object({
	primaryLanguage: z.enum(["en", "de", "fr", "es", "it"]),
});
export type MerchantLanguageInput = z.infer<typeof merchantLanguageSchema>;

// ============================================================================
// STORE SCHEMAS
// ============================================================================

export const storeDetailsSchema = z.object({
	name: z
		.string()
		.min(2, "Store name must be at least 2 characters")
		.max(100, "Store name must be less than 100 characters"),
	street: z.string().min(1, "Street address is required"),
	city: z.string().min(1, "City is required"),
	postalCode: z.string().min(1, "Postal code is required"),
	country: z.string().min(1, "Country is required"),
	phone: z.string(),
	email: z.string(),
});
export type StoreDetailsInput = z.infer<typeof storeDetailsSchema>;

export const storeRegionalSchema = z.object({
	timezone: z.string().min(1, "Timezone is required"),
	currency: z.enum(["EUR", "USD", "GBP", "CHF"]),
});
export type StoreRegionalInput = z.infer<typeof storeRegionalSchema>;
