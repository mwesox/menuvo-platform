import { env } from "../../env";

export const EMAIL_CONFIG = {
	/** Sender email address (shown as "from" in emails) */
	SENDER_EMAIL: "noreply@menuvo.app",

	/** Sender name (shown as "from" name in emails) */
	SENDER_NAME: "Menuvo",
} as const;

/** Get the Brevo API Key */
export function getApiKey(): string {
	const apiKey = env.BREVO_API_KEY;
	if (!apiKey) {
		throw new Error("BREVO_API_KEY is not configured");
	}
	return apiKey;
}
