import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
// German translations
import businessDe from "./locales/de/business.json";
import legalDe from "./locales/de/legal.json";
// English translations
import businessEn from "./locales/en/business.json";
import legalEn from "./locales/en/legal.json";

export const SUPPORTED_LANGUAGES = ["en", "de"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

const resources = {
	en: {
		business: businessEn,
		legal: legalEn,
	},
	de: {
		business: businessDe,
		legal: legalDe,
	},
};

export function initI18n(detectedLanguage?: string) {
	if (i18n.isInitialized) {
		// Ensure resources are up-to-date (important for HMR in development)
		for (const lng of SUPPORTED_LANGUAGES) {
			for (const ns of Object.keys(resources[lng])) {
				const currentResources =
					resources[lng][ns as keyof (typeof resources)[typeof lng]];
				i18n.addResourceBundle(lng, ns, currentResources, true, true);
			}
		}
		// Update language if different
		if (detectedLanguage && i18n.language !== detectedLanguage) {
			i18n.changeLanguage(detectedLanguage);
		}
		return i18n;
	}

	i18n
		.use(LanguageDetector)
		.use(initReactI18next)
		.init({
			resources,
			lng: detectedLanguage,
			fallbackLng: DEFAULT_LANGUAGE,
			supportedLngs: [...SUPPORTED_LANGUAGES],
			defaultNS: "business",
			ns: ["business", "legal"],
			interpolation: {
				escapeValue: false,
			},
			detection: {
				order: ["localStorage", "navigator"],
				caches: ["localStorage"],
				lookupLocalStorage: "menuvo-language",
			},
			react: {
				useSuspense: false,
			},
		});

	return i18n;
}

export default i18n;
