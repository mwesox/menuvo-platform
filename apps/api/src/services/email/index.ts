// Types

// Client
export { type GraphServiceClient, getGraphClient } from "./client";
// Config
export { EMAIL_CONFIG } from "./config";
// Service
export { sendEmail } from "./service";
// Templates - Base (for extensibility)
export {
	createButton,
	EMAIL_STYLES,
	escapeHtml,
	wrapWithBaseTemplate,
} from "./templates/base";
// Templates - Auth
export {
	type EmailVerificationTemplateOptions,
	getEmailVerificationTemplate,
} from "./templates/email-verification";
export {
	getPasswordResetTemplate,
	type PasswordResetTemplateOptions,
} from "./templates/password-reset";
export type {
	BaseTemplateOptions,
	Locale,
	SendEmailOptions,
	TemplateResult,
} from "./types";
