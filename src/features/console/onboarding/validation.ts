import { z } from "zod";

export const onboardingSchema = z.object({
	merchant: z.object({
		name: z
			.string()
			.min(2, "Business name must be at least 2 characters")
			.max(100, "Business name must be less than 100 characters"),
		email: z.string().email("Please enter a valid email address"),
		phone: z.string().optional(),
		primaryLanguage: z.enum(["en", "de", "fr", "es", "it"]).default("en"),
	}),
	store: z.object({
		name: z
			.string()
			.min(2, "Store name must be at least 2 characters")
			.max(100, "Store name must be less than 100 characters"),
		street: z.string().min(1, "Street address is required"),
		city: z.string().min(1, "City is required"),
		postalCode: z.string().min(1, "Postal code is required"),
		country: z.string().min(1, "Country is required"),
		timezone: z.string().default("Europe/Berlin"),
		currency: z.enum(["EUR", "USD", "GBP", "CHF"]).default("EUR"),
	}),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

// Client-side form schema with types matching form initial values
export const onboardingFormSchema = z.object({
	merchant: z.object({
		name: z
			.string()
			.min(2, "Business name must be at least 2 characters")
			.max(100, "Business name must be less than 100 characters"),
		email: z.string().email("Please enter a valid email address"),
		phone: z.string(),
		primaryLanguage: z.enum(["en", "de", "fr", "es", "it"]),
	}),
	store: z.object({
		name: z
			.string()
			.min(2, "Store name must be at least 2 characters")
			.max(100, "Store name must be less than 100 characters"),
		street: z.string().min(1, "Street address is required"),
		city: z.string().min(1, "City is required"),
		postalCode: z.string().min(1, "Postal code is required"),
		country: z.string().min(1, "Country is required"),
		timezone: z.string(),
		currency: z.enum(["EUR", "USD", "GBP", "CHF"]),
	}),
});
export type OnboardingFormInput = z.infer<typeof onboardingFormSchema>;

export const languages = [
	{ value: "en", label: "English" },
	{ value: "de", label: "Deutsch" },
	{ value: "fr", label: "Français" },
	{ value: "es", label: "Español" },
	{ value: "it", label: "Italiano" },
] as const;

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
