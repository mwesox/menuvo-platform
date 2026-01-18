import type { BaseTemplateOptions, Locale, TemplateResult } from "../types";
import {
	createButton,
	EMAIL_STYLES,
	escapeHtml,
	wrapWithBaseTemplate,
} from "./base";

interface EmailVerificationContent {
	subject: string;
	heading: string;
	greeting: (name?: string) => string;
	message: string;
	buttonText: string;
	ignoreNote: string;
}

const content: Record<Locale, EmailVerificationContent> = {
	en: {
		subject: "Verify your Menuvo email",
		heading: "Verify Your Email",
		greeting: (name) => (name ? `Welcome ${escapeHtml(name)}!` : "Welcome!"),
		message:
			"Thanks for signing up for Menuvo. Please verify your email address by clicking the button below.",
		buttonText: "Verify Email",
		ignoreNote:
			"If you didn't create a Menuvo account, you can safely ignore this email.",
	},
	de: {
		subject: "Bestätige deine Menuvo E-Mail",
		heading: "E-Mail bestätigen",
		greeting: (name) =>
			name ? `Willkommen ${escapeHtml(name)}!` : "Willkommen!",
		message:
			"Danke, dass du dich bei Menuvo registriert hast. Bitte bestätige deine E-Mail-Adresse, indem du auf den Button unten klickst.",
		buttonText: "E-Mail bestätigen",
		ignoreNote:
			"Falls du kein Menuvo-Konto erstellt hast, kannst du diese E-Mail ignorieren.",
	},
};

export interface EmailVerificationTemplateOptions extends BaseTemplateOptions {
	verifyUrl: string;
	userName?: string;
}

export function getEmailVerificationTemplate({
	verifyUrl,
	userName,
	locale = "en",
}: EmailVerificationTemplateOptions): TemplateResult {
	const t = content[locale];

	const htmlContent = `
      <h1 style="${EMAIL_STYLES.heading}">${t.heading}</h1>
      <p style="${EMAIL_STYLES.paragraph}">
        ${t.greeting(userName)}<br><br>
        ${t.message}
      </p>
      ${createButton(verifyUrl, t.buttonText)}
      <p style="${EMAIL_STYLES.smallText}">
        ${t.ignoreNote}
      </p>
    `;

	return {
		subject: t.subject,
		html: wrapWithBaseTemplate(htmlContent),
	};
}
