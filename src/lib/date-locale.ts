import type { Locale } from "date-fns";
import { de, enUS } from "date-fns/locale";
import i18n from "@/i18n/config";

const localeMap: Record<string, Locale> = {
	en: enUS,
	de: de,
};

export function getDateLocale(): Locale {
	return localeMap[i18n.language] ?? enUS;
}
