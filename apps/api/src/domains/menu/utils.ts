/**
 * Menu Domain Utilities
 *
 * Helper functions for menu-related operations, particularly translation handling.
 */

import type { ChoiceTranslations, EntityTranslations } from "@menuvo/db/schema";

/**
 * Normalize browser language code to 2-letter ISO 639-1 format
 * Handles both extended ("en-US", "de-DE") and short ("en", "de") formats
 * @param languageCode - Browser language code (e.g., "en-US", "de-DE", "en")
 * @returns Normalized 2-letter lowercase code (e.g., "en", "de")
 */
export function normalizeLanguageCode(languageCode: string): string {
	if (!languageCode) return "";

	// Extract first 2 characters and convert to lowercase
	// Handles: "en-US" -> "en", "de-DE" -> "de", "en" -> "en"
	const normalized = languageCode.trim().toLowerCase().slice(0, 2);

	return normalized;
}

/**
 * Extract translated name from translations JSONB
 * Falls back to first available language if requested language not found
 */
export function getTranslatedName(
	translations: EntityTranslations | ChoiceTranslations | null,
	languageCode: string,
): string {
	if (!translations) return "";

	// Try requested language first
	const translation = translations[languageCode];
	if (translation?.name) return translation.name;

	// Fall back to first available translation
	const firstLang = Object.keys(translations)[0];
	if (firstLang && translations[firstLang]?.name) {
		return translations[firstLang].name;
	}

	return "";
}

/**
 * Extract translated description from translations JSONB
 */
export function getTranslatedDescription(
	translations: EntityTranslations | null,
	languageCode: string,
): string | null {
	if (!translations) return null;

	// Try requested language first
	const translation = translations[languageCode];
	if (translation?.description !== undefined)
		return translation.description ?? null;

	// Fall back to first available translation
	const firstLang = Object.keys(translations)[0];
	if (firstLang && translations[firstLang]?.description !== undefined) {
		return translations[firstLang].description ?? null;
	}

	return null;
}
