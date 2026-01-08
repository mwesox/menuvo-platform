import type { ChoiceTranslations, EntityTranslations } from "@menuvo/db/schema";
import type { TranslationStatus } from "../schemas";

// ============================================================================
// LOCALIZED CONTENT EXTRACTION
// ============================================================================

/**
 * Get localized content from translations with fallback chain:
 * 1. Requested language
 * 2. Fallback language (first language in supportedLanguages)
 * 3. First available translation
 *
 * @example
 * const { name, description } = getLocalizedContent(
 *   item.translations,
 *   "fr",                        // requested
 *   supportedLanguages[0]        // fallback (first supported language)
 * );
 */
export function getLocalizedContent(
	translations: EntityTranslations | null | undefined,
	requestedLang: string,
	fallbackLang: string,
): { name: string; description: string | null } {
	if (!translations || Object.keys(translations).length === 0) {
		return { name: "", description: null };
	}

	// 1. Try requested language
	if (translations[requestedLang]?.name) {
		return {
			name: translations[requestedLang].name ?? "",
			description: translations[requestedLang].description ?? null,
		};
	}

	// 2. Fallback to first supported language
	if (translations[fallbackLang]?.name) {
		return {
			name: translations[fallbackLang].name ?? "",
			description: translations[fallbackLang].description ?? null,
		};
	}

	// 3. Fallback to first available
	for (const lang of Object.keys(translations)) {
		if (translations[lang]?.name) {
			return {
				name: translations[lang].name ?? "",
				description: translations[lang].description ?? null,
			};
		}
	}

	return { name: "", description: null };
}

/**
 * Get localized name from choice translations with fallback chain.
 * Uses supportedLanguages[0] as the fallback language.
 */
export function getLocalizedChoiceName(
	translations: ChoiceTranslations | null | undefined,
	requestedLang: string,
	fallbackLang: string,
): string {
	if (!translations || Object.keys(translations).length === 0) {
		return "";
	}

	// 1. Try requested language
	if (translations[requestedLang]?.name) {
		return translations[requestedLang].name ?? "";
	}

	// 2. Fallback to first supported language
	if (translations[fallbackLang]?.name) {
		return translations[fallbackLang].name ?? "";
	}

	// 3. Fallback to first available
	for (const lang of Object.keys(translations)) {
		if (translations[lang]?.name) {
			return translations[lang].name ?? "";
		}
	}

	return "";
}

// ============================================================================
// TRANSLATION STATUS CALCULATION
// ============================================================================

/**
 * Calculate translation status for an entity across all supported languages.
 * All languages are treated equally (no special treatment for default language).
 *
 * @param translations - The entity's translations JSONB
 * @param supportedLanguages - All languages the merchant supports
 * @param hasDescriptionField - Whether this entity type has a description field
 * @returns Overall status and per-language breakdown
 */
export function calculateTranslationStatus(
	translations: EntityTranslations | null,
	supportedLanguages: string[],
	hasDescriptionField: boolean,
): {
	status: TranslationStatus;
	byLanguage: Record<string, TranslationStatus>;
} {
	const byLanguage: Record<string, TranslationStatus> = {};
	let completeCount = 0;
	let partialCount = 0;

	for (const lang of supportedLanguages) {
		const translation = translations?.[lang];
		const hasName = Boolean(translation?.name?.trim());
		const hasDescription = Boolean(translation?.description?.trim());

		if (hasDescriptionField) {
			// For entities with description: both fields required for "complete"
			if (hasName && hasDescription) {
				byLanguage[lang] = "complete";
				completeCount++;
			} else if (hasName || hasDescription) {
				byLanguage[lang] = "partial";
				partialCount++;
			} else {
				byLanguage[lang] = "missing";
			}
		} else {
			// For entities with only name (option choices)
			if (hasName) {
				byLanguage[lang] = "complete";
				completeCount++;
			} else {
				byLanguage[lang] = "missing";
			}
		}
	}

	// Overall status
	let status: TranslationStatus;
	if (completeCount === supportedLanguages.length) {
		status = "complete";
	} else if (completeCount > 0 || partialCount > 0) {
		status = "partial";
	} else {
		status = "missing";
	}

	return { status, byLanguage };
}

/**
 * Calculate translation status for an option choice (name only).
 */
export function calculateChoiceTranslationStatus(
	translations: ChoiceTranslations | null,
	supportedLanguages: string[],
): {
	status: TranslationStatus;
	byLanguage: Record<string, TranslationStatus>;
} {
	const byLanguage: Record<string, TranslationStatus> = {};
	let completeCount = 0;

	for (const lang of supportedLanguages) {
		const hasName = Boolean(translations?.[lang]?.name?.trim());
		if (hasName) {
			byLanguage[lang] = "complete";
			completeCount++;
		} else {
			byLanguage[lang] = "missing";
		}
	}

	const status: TranslationStatus =
		completeCount === supportedLanguages.length
			? "complete"
			: completeCount > 0
				? "partial"
				: "missing";

	return { status, byLanguage };
}

// ============================================================================
// TRANSLATION HELPERS
// ============================================================================

/**
 * Get missing languages for an entity.
 */
export function getMissingLanguages(
	translations: EntityTranslations | null,
	supportedLanguages: string[],
	hasDescriptionField: boolean,
): string[] {
	const { byLanguage } = calculateTranslationStatus(
		translations,
		supportedLanguages,
		hasDescriptionField,
	);
	return supportedLanguages.filter((lang) => byLanguage[lang] !== "complete");
}

/**
 * Update translations for a specific language.
 * Returns a new translations object with the update applied.
 */
export function updateTranslationForLanguage(
	translations: EntityTranslations | null,
	language: string,
	name: string,
	description?: string,
): EntityTranslations {
	return {
		...translations,
		[language]: {
			name,
			description: description ?? "",
		},
	};
}

/**
 * Update choice translation for a specific language.
 */
export function updateChoiceTranslationForLanguage(
	translations: ChoiceTranslations | null,
	language: string,
	name: string,
): ChoiceTranslations {
	return {
		...translations,
		[language]: { name },
	};
}
