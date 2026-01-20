/**
 * Welcome Email Template
 *
 * Sent to new merchants after completing onboarding.
 */

import { z } from "zod";
import {
	createButton,
	EMAIL_STYLES,
	escapeHtml,
	wrapWithBaseTemplate,
} from "../../../infrastructure/email/templates/base.js";
import type {
	BaseTemplateOptions,
	Locale,
	TemplateResult,
} from "../../../infrastructure/email/types.js";

export const welcomeTemplateOptionsSchema = z.object({
	ownerName: z.string().min(1),
	storeName: z.string().min(1),
	trialEndsAt: z.date(),
	dashboardUrl: z.string().url(),
	locale: z.enum(["en", "de"]).default("de"),
});

export type WelcomeTemplateOptions = z.infer<
	typeof welcomeTemplateOptionsSchema
>;

interface WelcomeContent {
	subject: string;
	heading: string;
	greeting: (name: string) => string;
	storeCreated: (storeName: string) => string;
	trialInfo: (date: string) => string;
	getStarted: string;
	buttonText: string;
	support: string;
	supportEmail: string;
}

const content: Record<Locale, WelcomeContent> = {
	en: {
		subject: "Welcome to Menuvo!",
		heading: "Welcome to Menuvo!",
		greeting: (name) => `Hi ${escapeHtml(name)},`,
		storeCreated: (storeName) =>
			`Your store <strong>${escapeHtml(storeName)}</strong> has been created successfully.`,
		trialInfo: (date) =>
			`You have a 30-day free trial to explore all features. Your trial ends on <strong>${date}</strong>.`,
		getStarted:
			"Get started by adding your menu items and customizing your digital menu.",
		buttonText: "Go to Dashboard",
		support: "Questions? We're here to help:",
		supportEmail: "support@menuvo.app",
	},
	de: {
		subject: "Willkommen bei Menuvo!",
		heading: "Willkommen bei Menuvo!",
		greeting: (name) => `Hallo ${escapeHtml(name)},`,
		storeCreated: (storeName) =>
			`Dein Geschäft <strong>${escapeHtml(storeName)}</strong> wurde erfolgreich erstellt.`,
		trialInfo: (date) =>
			`Du hast eine 30-tägige kostenlose Testphase, um alle Funktionen zu erkunden. Deine Testphase endet am <strong>${date}</strong>.`,
		getStarted:
			"Beginne damit, deine Menüpunkte hinzuzufügen und dein digitales Menü anzupassen.",
		buttonText: "Zum Dashboard",
		support: "Fragen? Wir helfen gerne:",
		supportEmail: "support@menuvo.app",
	},
};

export function getWelcomeTemplate(
	options: WelcomeTemplateOptions & BaseTemplateOptions,
): TemplateResult {
	const locale = options.locale ?? "de";
	const t = content[locale];

	const formattedDate = options.trialEndsAt.toLocaleDateString(
		locale === "de" ? "de-DE" : "en-US",
		{
			year: "numeric",
			month: "long",
			day: "numeric",
		},
	);

	const htmlContent = `
      <h1 style="${EMAIL_STYLES.heading}">${t.heading}</h1>
      <p style="${EMAIL_STYLES.paragraph}">
        ${t.greeting(options.ownerName)}<br><br>
        ${t.storeCreated(options.storeName)}<br><br>
        ${t.trialInfo(formattedDate)}<br><br>
        ${t.getStarted}
      </p>
      ${createButton(options.dashboardUrl, t.buttonText)}
      <p style="${EMAIL_STYLES.smallText}">
        ${t.support} <a href="mailto:${t.supportEmail}" style="color:#e1393b;text-decoration:none;">${t.supportEmail}</a>
      </p>
    `;

	return {
		subject: t.subject,
		html: wrapWithBaseTemplate(htmlContent),
	};
}
