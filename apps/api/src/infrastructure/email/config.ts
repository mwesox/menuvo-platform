import { env } from "../../env";

export const EMAIL_CONFIG = {
	/** Sender email address (shown as "from" in emails) */
	SENDER_EMAIL: "noreply@menuvo.app",

	/** Sender name (shown as "from" name in emails) */
	SENDER_NAME: "Menuvo",
} as const;

/** Get the SMTP configuration */
export function getSmtpConfig() {
	const host = env.SMTP_HOST;
	const user = env.SMTP_USER;
	const password = env.SMTP_PASSWORD;

	if (!host || !user || !password) {
		throw new Error("SMTP credentials are not configured");
	}

	return {
		host,
		port: env.SMTP_PORT,
		user,
		password,
	};
}
