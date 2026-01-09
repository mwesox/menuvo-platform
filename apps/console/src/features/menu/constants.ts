/**
 * Menu-related constants.
 *
 * Following the pattern from orders/constants.ts:
 * - Export constant arrays for enum-like values
 * - Export type definitions derived from constants
 */

// ============================================================================
// ALLERGENS
// ============================================================================

/**
 * Standard allergen keys (EU 14 allergens).
 * Database stores these as string values.
 * Labels come from i18n translations (menu:allergens.{key}).
 */
export const ALLERGEN_KEYS = [
	"gluten",
	"dairy",
	"eggs",
	"nuts",
	"peanuts",
	"soy",
	"fish",
	"shellfish",
	"sesame",
	"celery",
	"mustard",
	"lupin",
	"molluscs",
	"sulphites",
] as const;

export type AllergenKey = (typeof ALLERGEN_KEYS)[number];
