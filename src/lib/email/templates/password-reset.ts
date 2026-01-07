import type { BaseTemplateOptions, Locale, TemplateResult } from "../types";
import {
	createButton,
	EMAIL_STYLES,
	escapeHtml,
	wrapWithBaseTemplate,
} from "./base";

interface PasswordResetContent {
	subject: string;
	heading: string;
	greeting: (name?: string) => string;
	message: string;
	buttonText: string;
	expiryNote: string;
	ignoreNote: string;
}

const content: Record<Locale, PasswordResetContent> = {
	en: {
		subject: "Reset your Menuvo password",
		heading: "Reset Your Password",
		greeting: (name) => (name ? `Hi ${escapeHtml(name)},` : "Hi,"),
		message:
			"We received a request to reset your password. Click the button below to create a new password.",
		buttonText: "Reset Password",
		expiryNote: "This link expires in 1 hour.",
		ignoreNote: "If you didn't request this, you can safely ignore this email.",
	},
	de: {
		subject: "Setze dein Menuvo-Passwort zurück",
		heading: "Passwort zurücksetzen",
		greeting: (name) => (name ? `Hallo ${escapeHtml(name)},` : "Hallo,"),
		message:
			"Wir haben eine Anfrage erhalten, dein Passwort zurückzusetzen. Klicke auf den Button unten, um ein neues Passwort zu erstellen.",
		buttonText: "Passwort zurücksetzen",
		expiryNote: "Dieser Link ist 1 Stunde gültig.",
		ignoreNote:
			"Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.",
	},
};

export interface PasswordResetTemplateOptions extends BaseTemplateOptions {
	resetUrl: string;
	userName?: string;
}

export function getPasswordResetTemplate({
	resetUrl,
	userName,
	locale = "en",
}: PasswordResetTemplateOptions): TemplateResult {
	const t = content[locale];

	const htmlContent = `
      <h1 style="${EMAIL_STYLES.heading}">${t.heading}</h1>
      <p style="${EMAIL_STYLES.paragraph}">
        ${t.greeting(userName)}<br><br>
        ${t.message}
      </p>
      ${createButton(resetUrl, t.buttonText)}
      <p style="${EMAIL_STYLES.smallText}">
        ${t.expiryNote} ${t.ignoreNote}
      </p>
    `;

	return {
		subject: t.subject,
		html: wrapWithBaseTemplate(htmlContent),
	};
}
