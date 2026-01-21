/**
 * Country data for PhoneInput component
 * European countries prioritized (DE, AT, CH first)
 */

export interface CountryOption {
	code: string; // ISO 3166-1 alpha-2 code
	dialCode: string; // E.164 dial code with +
	name: string; // Country name in English
	flag: string; // Emoji flag
}

export const COUNTRIES: CountryOption[] = [
	// Priority: DACH region first
	{ code: "DE", dialCode: "+49", name: "Germany", flag: "🇩🇪" },
	{ code: "AT", dialCode: "+43", name: "Austria", flag: "🇦🇹" },
	{ code: "CH", dialCode: "+41", name: "Switzerland", flag: "🇨🇭" },
	// Other European countries
	{ code: "BE", dialCode: "+32", name: "Belgium", flag: "🇧🇪" },
	{ code: "CZ", dialCode: "+420", name: "Czech Republic", flag: "🇨🇿" },
	{ code: "DK", dialCode: "+45", name: "Denmark", flag: "🇩🇰" },
	{ code: "ES", dialCode: "+34", name: "Spain", flag: "🇪🇸" },
	{ code: "FI", dialCode: "+358", name: "Finland", flag: "🇫🇮" },
	{ code: "FR", dialCode: "+33", name: "France", flag: "🇫🇷" },
	{ code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧" },
	{ code: "GR", dialCode: "+30", name: "Greece", flag: "🇬🇷" },
	{ code: "HU", dialCode: "+36", name: "Hungary", flag: "🇭🇺" },
	{ code: "IE", dialCode: "+353", name: "Ireland", flag: "🇮🇪" },
	{ code: "IT", dialCode: "+39", name: "Italy", flag: "🇮🇹" },
	{ code: "LI", dialCode: "+423", name: "Liechtenstein", flag: "🇱🇮" },
	{ code: "LU", dialCode: "+352", name: "Luxembourg", flag: "🇱🇺" },
	{ code: "NL", dialCode: "+31", name: "Netherlands", flag: "🇳🇱" },
	{ code: "NO", dialCode: "+47", name: "Norway", flag: "🇳🇴" },
	{ code: "PL", dialCode: "+48", name: "Poland", flag: "🇵🇱" },
	{ code: "PT", dialCode: "+351", name: "Portugal", flag: "🇵🇹" },
	{ code: "SE", dialCode: "+46", name: "Sweden", flag: "🇸🇪" },
	{ code: "SK", dialCode: "+421", name: "Slovakia", flag: "🇸🇰" },
	// Common international
	{ code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸" },
	{ code: "CA", dialCode: "+1", name: "Canada", flag: "🇨🇦" },
];

/**
 * Find a country by its ISO code
 */
export function findCountryByCode(code: string): CountryOption | undefined {
	return COUNTRIES.find((c) => c.code.toLowerCase() === code.toLowerCase());
}

/**
 * Find a country by its dial code (e.g., "+49")
 * Returns the first match (useful since some countries share dial codes)
 */
export function findCountryByDialCode(
	dialCode: string,
): CountryOption | undefined {
	return COUNTRIES.find((c) => c.dialCode === dialCode);
}

/**
 * Parse an E.164 phone number into country and local number
 * @param value E.164 format phone number (e.g., "+4917612345678")
 * @returns Object with country and number, or null if invalid
 */
export function parseE164(
	value: string,
): { country: CountryOption; number: string } | null {
	if (!value || !value.startsWith("+")) {
		return null;
	}

	// Try to match dial codes from longest to shortest
	// This handles cases like +1 (US/CA) vs +353 (Ireland)
	const sortedCountries = [...COUNTRIES].sort(
		(a, b) => b.dialCode.length - a.dialCode.length,
	);

	for (const country of sortedCountries) {
		if (value.startsWith(country.dialCode)) {
			return {
				country,
				number: value.slice(country.dialCode.length),
			};
		}
	}

	return null;
}

/**
 * Format a country and local number to E.164 format
 * @param country The country option
 * @param number The local phone number
 * @returns E.164 formatted phone number
 */
export function formatE164(country: CountryOption, number: string): string {
	// Remove any non-digit characters from the number
	let cleanNumber = number.replace(/\D/g, "");
	// Strip leading zero (common in local formats like 0176 -> 176)
	if (cleanNumber.startsWith("0")) {
		cleanNumber = cleanNumber.slice(1);
	}
	return `${country.dialCode}${cleanNumber}`;
}
