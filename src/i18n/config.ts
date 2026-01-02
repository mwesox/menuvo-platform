import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
// German translations
import businessDe from "./locales/de/business.json";
import commonDe from "./locales/de/common.json";
import discoveryDe from "./locales/de/discovery.json";
import formsDe from "./locales/de/forms.json";
import legalDe from "./locales/de/legal.json";
import menuDe from "./locales/de/menu.json";
import navigationDe from "./locales/de/navigation.json";
import onboardingDe from "./locales/de/onboarding.json";
import servicePointsDe from "./locales/de/servicePoints.json";
import settingsDe from "./locales/de/settings.json";
import shopDe from "./locales/de/shop.json";
import storesDe from "./locales/de/stores.json";
import toastsDe from "./locales/de/toasts.json";
import validationDe from "./locales/de/validation.json";
// English translations
import businessEn from "./locales/en/business.json";
import commonEn from "./locales/en/common.json";
import discoveryEn from "./locales/en/discovery.json";
import formsEn from "./locales/en/forms.json";
import legalEn from "./locales/en/legal.json";
import menuEn from "./locales/en/menu.json";
import navigationEn from "./locales/en/navigation.json";
import onboardingEn from "./locales/en/onboarding.json";
import servicePointsEn from "./locales/en/servicePoints.json";
import settingsEn from "./locales/en/settings.json";
import shopEn from "./locales/en/shop.json";
import storesEn from "./locales/en/stores.json";
import toastsEn from "./locales/en/toasts.json";
import validationEn from "./locales/en/validation.json";

export const SUPPORTED_LANGUAGES = ["en", "de"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

const resources = {
	en: {
		business: businessEn,
		common: commonEn,
		navigation: navigationEn,
		forms: formsEn,
		toasts: toastsEn,
		menu: menuEn,
		stores: storesEn,
		servicePoints: servicePointsEn,
		settings: settingsEn,
		onboarding: onboardingEn,
		legal: legalEn,
		discovery: discoveryEn,
		shop: shopEn,
		validation: validationEn,
	},
	de: {
		business: businessDe,
		common: commonDe,
		navigation: navigationDe,
		forms: formsDe,
		toasts: toastsDe,
		menu: menuDe,
		stores: storesDe,
		servicePoints: servicePointsDe,
		settings: settingsDe,
		onboarding: onboardingDe,
		legal: legalDe,
		discovery: discoveryDe,
		shop: shopDe,
		validation: validationDe,
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
			ns: [
				"business",
				"common",
				"navigation",
				"forms",
				"toasts",
				"menu",
				"stores",
				"servicePoints",
				"settings",
				"onboarding",
				"legal",
				"discovery",
				"shop",
				"validation",
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
