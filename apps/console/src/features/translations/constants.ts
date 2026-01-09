/**
 * Translation-related constants.
 */

// ============================================================================
// LANGUAGE CODES
// ============================================================================

/**
 * Supported language codes for menu translations.
 */
export const LANGUAGE_CODES = ["en", "de", "fr", "es", "it"] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];

/**
 * Language options with labels for UI display.
 */
export const LANGUAGE_OPTIONS = [
	{ value: "en", label: "English" },
	{ value: "de", label: "Deutsch" },
	{ value: "fr", label: "Français" },
	{ value: "es", label: "Español" },
	{ value: "it", label: "Italiano" },
] as const;

// ============================================================================
// ENTITY TYPES
// ============================================================================

/**
 * Entity types that can have translations.
 */
export const ENTITY_TYPES = [
	"category",
	"item",
	"optionGroup",
	"optionChoice",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];
