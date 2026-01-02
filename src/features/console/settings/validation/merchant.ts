import { z } from "zod";

// Re-export shared constants from onboarding
export { languages } from "@/features/console/onboarding/validation.ts";

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

// No longer needed - languages managed via supportedLanguages array only
// Kept as reference if a simple language preference form is needed
export const merchantLanguageSchema = z.object({
	supportedLanguages: z
		.array(z.enum(["en", "de", "fr", "es", "it"]))
		.min(1, "At least one language is required"),
});
export type MerchantLanguageInput = z.infer<typeof merchantLanguageSchema>;
