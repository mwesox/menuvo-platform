// Menu-local translation helpers.

type TranslationRecord = Record<
	string,
	{ name?: string; description?: string } | undefined
>;

/**
 * Get localized content from translations with fallback chain:
 * 1. Requested language
 * 2. Fallback language (first supported language)
 * 3. First available translation
 */
export function getLocalizedContent(
	translations: TranslationRecord | null | undefined,
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
