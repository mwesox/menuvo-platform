import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
// German translations
import commonDe from "./locales/de/common.json";
import discoveryDe from "./locales/de/discovery.json";
import legalDe from "./locales/de/legal.json";
import menuDe from "./locales/de/menu.json";
import shopDe from "./locales/de/shop.json";
// English translations
import commonEn from "./locales/en/common.json";
import discoveryEn from "./locales/en/discovery.json";
import legalEn from "./locales/en/legal.json";
import menuEn from "./locales/en/menu.json";
import shopEn from "./locales/en/shop.json";

export const SUPPORTED_LANGUAGES = ["en", "de"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

const resources = {
	en: {
		common: commonEn,
		discovery: discoveryEn,
		legal: legalEn,
		menu: menuEn,
		shop: shopEn,
	},
	de: {
		common: commonDe,
		discovery: discoveryDe,
		legal: legalDe,
		menu: menuDe,
		shop: shopDe,
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
			defaultNS: "common",
			ns: ["common", "discovery", "legal", "menu", "shop"],
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
