/**
 * Global app configuration.
 */
export const config = {
	/** Default locale for external services (Mollie onboarding, etc.) */
	defaultLocale: "de_DE",

	/** Default timezone for new stores */
	defaultTimezone: "Europe/Berlin",

	/** Default currency for new stores */
	defaultCurrency: "EUR" as const,

	/** Platform fee percentage for connected merchant payments (5%) */
	platformFeePercent: 0.05,
} as const;
