import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
// German translations
import commonDe from "./locales/de/common.json";
import formsDe from "./locales/de/forms.json";
import legalDe from "./locales/de/legal.json";
import menuDe from "./locales/de/menu.json";
import navigationDe from "./locales/de/navigation.json";
import onboardingDe from "./locales/de/onboarding.json";
import settingsDe from "./locales/de/settings.json";
import storesDe from "./locales/de/stores.json";
import toastsDe from "./locales/de/toasts.json";
// English translations
import commonEn from "./locales/en/common.json";
import formsEn from "./locales/en/forms.json";
import legalEn from "./locales/en/legal.json";
import menuEn from "./locales/en/menu.json";
import navigationEn from "./locales/en/navigation.json";
import onboardingEn from "./locales/en/onboarding.json";
import settingsEn from "./locales/en/settings.json";
import storesEn from "./locales/en/stores.json";
import toastsEn from "./locales/en/toasts.json";

export const SUPPORTED_LANGUAGES = ["en", "de"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

const resources = {
	en: {
		common: commonEn,
		navigation: navigationEn,
		forms: formsEn,
		toasts: toastsEn,
		menu: menuEn,
		stores: storesEn,
		settings: settingsEn,
		onboarding: onboardingEn,
		legal: legalEn,
	},
	de: {
		common: commonDe,
		navigation: navigationDe,
		forms: formsDe,
		toasts: toastsDe,
		menu: menuDe,
		stores: storesDe,
		settings: settingsDe,
		onboarding: onboardingDe,
		legal: legalDe,
	},
};

export function initI18n(detectedLanguage?: string) {
	if (i18n.isInitialized) return i18n;

	i18n
		.use(LanguageDetector)
		.use(initReactI18next)
		.init({
			resources,
			lng: detectedLanguage,
			fallbackLng: DEFAULT_LANGUAGE,
			supportedLngs: [...SUPPORTED_LANGUAGES],
			defaultNS: "common",
			ns: [
				"common",
				"navigation",
				"forms",
				"toasts",
				"menu",
				"stores",
				"settings",
				"onboarding",
				"legal",
			],
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
