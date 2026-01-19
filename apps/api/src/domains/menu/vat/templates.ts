/**
 * VAT Templates
 *
 * Default VAT group templates by country code.
 * These are used to pre-populate VAT groups when a new merchant is onboarded.
 */

export type CountryCode = "DE" | "AT" | "CH";

export interface VatTemplate {
	code: string;
	name: string;
	rate: number; // basis points (1900 = 19%)
	description?: string;
	displayOrder: number;
}

/**
 * VAT templates by country code.
 *
 * Germany (DE): 19% standard, 7% reduced
 * Austria (AT): 20% standard, 10% reduced
 * Switzerland (CH): 8.1% standard, 2.6% reduced, 3.8% accommodation
 */
export const VAT_TEMPLATES: Record<CountryCode, VatTemplate[]> = {
	// Germany
	DE: [
		{
			code: "NORM",
			name: "Normalsteuersatz (19%)",
			rate: 1900,
			description: "Regelsteuersatz",
			displayOrder: 0,
		},
		{
			code: "RED",
			name: "Ermäßigt (7%)",
			rate: 700,
			description: "Ermäßigter Steuersatz",
			displayOrder: 1,
		},
	],
	// Austria
	AT: [
		{
			code: "NORM",
			name: "Normalsteuersatz (20%)",
			rate: 2000,
			description: "Regelsteuersatz",
			displayOrder: 0,
		},
		{
			code: "RED",
			name: "Ermäßigt (10%)",
			rate: 1000,
			description: "Ermäßigter Steuersatz",
			displayOrder: 1,
		},
	],
	// Switzerland (MWST)
	CH: [
		{
			code: "NORM",
			name: "Normalsatz (8.1%)",
			rate: 810,
			description: "MWST-Normalsatz",
			displayOrder: 0,
		},
		{
			code: "RED",
			name: "Reduziert (2.6%)",
			rate: 260,
			description: "Reduzierter Satz",
			displayOrder: 1,
		},
		{
			code: "BEH",
			name: "Beherbergung (3.8%)",
			rate: 380,
			description: "Sondersatz",
			displayOrder: 2,
		},
	],
};

/**
 * Country name to ISO alpha-2 code mapping.
 * Supports both English and local language names (case-insensitive).
 */
const COUNTRY_MAP: Record<string, CountryCode> = {
	deutschland: "DE",
	germany: "DE",
	österreich: "AT",
	austria: "AT",
	schweiz: "CH",
	switzerland: "CH",
};

/**
 * Derive country code from a country name.
 *
 * @param country - Country name or ISO alpha-2 code
 * @returns Country code or undefined if not found
 */
export function deriveCountryCode(country: string): CountryCode | undefined {
	const normalized = country.toLowerCase().trim();

	// Check if already a valid country code
	if (normalized.length === 2) {
		const upperCode = normalized.toUpperCase();
		if (upperCode in VAT_TEMPLATES) {
			return upperCode as CountryCode;
		}
	}

	return COUNTRY_MAP[normalized];
}

/**
 * Get VAT templates for a country code.
 *
 * @param countryCode - ISO alpha-2 country code
 * @returns VAT templates or undefined if country not supported
 */
export function getVatTemplates(
	countryCode: string,
): VatTemplate[] | undefined {
	return VAT_TEMPLATES[countryCode as CountryCode];
}
