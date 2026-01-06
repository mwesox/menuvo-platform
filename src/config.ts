import type { SupportedLanguage } from "@/i18n/config";

/**
 * Global app configuration.
 */
export const config = {
	/** Language for menu content translations (prototype: German only) */
	displayLanguage: "de" as SupportedLanguage,

	/** Default locale for external services (Mollie onboarding, etc.) */
	defaultLocale: "de_DE",

	/** Default timezone for new stores */
	defaultTimezone: "Europe/Berlin",

	/** Default currency for new stores */
	defaultCurrency: "EUR" as const,

	/** Platform fee percentage for connected merchant payments (5%) */
	platformFeePercent: 0.05,
} as const;
