import { MENU_LANGUAGE_FALLBACK } from "../../config";

export const menuQueryDefaults = {
	staleTimeMs: 1000 * 60 * 5,
};

/**
 * Resolve language code from i18n or fallback
 * Used in React components where i18n is initialized
 */
export function resolveMenuLanguageCode(language?: string | null): string {
	const normalized = language?.trim();
	return normalized ? normalized : MENU_LANGUAGE_FALLBACK;
}

/**
 * Get browser language code for menu queries
 * Passes raw navigator.language to backend (e.g., "en-US", "de-DE", "en")
 * Backend handles normalization and validation
 *
 * Use this in route loaders where i18n might not be initialized yet
 */
export function getMenuLanguageCode(): string {
	// Safety check for browser environment
	if (typeof window === "undefined" || !navigator?.language) {
		return MENU_LANGUAGE_FALLBACK;
	}

	// Pass raw browser language - backend will normalize and validate
	return navigator.language;
}
