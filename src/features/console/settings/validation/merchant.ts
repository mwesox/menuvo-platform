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

export const merchantLanguageSchema = z.object({
	primaryLanguage: z.enum(["en", "de", "fr", "es", "it"]),
});
export type MerchantLanguageInput = z.infer<typeof merchantLanguageSchema>;
