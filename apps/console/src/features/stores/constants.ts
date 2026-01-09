/**
 * Store-related constants.
 */

// ============================================================================
// COUNTRIES
// ============================================================================

/**
 * Supported countries for store addresses.
 */
export const COUNTRIES = [
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

export type CountryCode = (typeof COUNTRIES)[number]["value"];
