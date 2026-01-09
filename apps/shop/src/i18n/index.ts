export {
	DEFAULT_LANGUAGE,
	default as i18n,
	initI18n,
	SUPPORTED_LANGUAGES,
	type SupportedLanguage,
} from "./config";

// Note: detectLanguageFromRequest was removed because it used TanStack Start
// server functions which are not available in this Vite SPA.
// Language detection is now handled client-side in the config.
