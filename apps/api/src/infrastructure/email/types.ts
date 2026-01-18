/** Supported locales for email templates */
export type Locale = "en" | "de";

/** Options for sending raw emails */
export interface SendEmailOptions {
	to: string;
	subject: string;
	htmlBody: string;
	textBody?: string;
}

/** Base options for all templated emails */
export interface BaseTemplateOptions {
	locale?: Locale;
}

/** Result from template functions */
export interface TemplateResult {
	subject: string;
	html: string;
}
