/**
 * Date Formatting Utilities
 *
 * Formats dates using the current i18n language setting for proper regional formatting.
 */

import i18n from "../../../i18n/config";

/**
 * Map language codes to locale strings for date formatting
 */
function getLocaleForLanguage(languageCode: string): string {
	const lang = languageCode.split("-")[0] || "en";
	switch (lang) {
		case "de":
			return "de-DE";
		case "en":
			return "en-US";
		default:
			return "en-US";
	}
}

/**
 * Get current locale from i18n
 */
function getCurrentLocale(): string {
	const language = i18n.language || "en";
	return getLocaleForLanguage(language);
}

/**
 * Format a date with full date and time
 * Includes both date and time in a readable format
 */
export function formatDateTime(
	date: Date | string,
	options?: Intl.DateTimeFormatOptions,
): string {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	const locale = getCurrentLocale();

	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		...options,
	};

	return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

/**
 * Format a date with date and time in a more readable format
 * Shows date and time separately for better readability
 */
export function formatDateTimeReadable(date: Date | string): string {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	const locale = getCurrentLocale();

	const dateStr = new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(dateObj);

	const timeStr = new Intl.DateTimeFormat(locale, {
		hour: "2-digit",
		minute: "2-digit",
	}).format(dateObj);

	return `${dateStr}, ${timeStr}`;
}

/**
 * Format a date (date only, no time)
 */
export function formatDateOnly(
	date: Date | string,
	options?: Intl.DateTimeFormatOptions,
): string {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	const locale = getCurrentLocale();

	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		...options,
	};

	return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

/**
 * Format a time (time only, no date)
 */
export function formatTimeOnly(
	date: Date | string,
	options?: Intl.DateTimeFormatOptions,
): string {
	const dateObj = typeof date === "string" ? new Date(date) : date;
	const locale = getCurrentLocale();

	const defaultOptions: Intl.DateTimeFormatOptions = {
		hour: "2-digit",
		minute: "2-digit",
		...options,
	};

	return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}
