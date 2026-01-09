/**
 * Onboarding-related constants.
 */

// ============================================================================
// CURRENCIES
// ============================================================================

export const CURRENCIES = [
	{ value: "EUR", label: "Euro" },
	{ value: "USD", label: "US Dollar ($)" },
	{ value: "GBP", label: "British Pound" },
	{ value: "CHF", label: "Swiss Franc (CHF)" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["value"];

// ============================================================================
// TIMEZONES
// ============================================================================

export const TIMEZONES = [
	{ value: "Europe/Berlin", label: "Berlin (CET)" },
	{ value: "Europe/London", label: "London (GMT)" },
	{ value: "Europe/Paris", label: "Paris (CET)" },
	{ value: "Europe/Zurich", label: "Zurich (CET)" },
	{ value: "America/New_York", label: "New York (EST)" },
	{ value: "America/Los_Angeles", label: "Los Angeles (PST)" },
] as const;

export type Timezone = (typeof TIMEZONES)[number]["value"];
