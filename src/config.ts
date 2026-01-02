import type { SupportedLanguage } from "@/i18n/config";

/**
 * Global app configuration.
 */
export const config = {
	/** Language for menu content translations (prototype: German only) */
	displayLanguage: "de" as SupportedLanguage,
} as const;
