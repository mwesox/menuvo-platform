import { SendSmtpEmail } from "@getbrevo/brevo";
import { emailLogger } from "../../lib/logger";
import { getBrevoClient } from "./client";
import { EMAIL_CONFIG } from "./config";
import type { SendEmailOptions } from "./types";

/**
 * Send an email using Brevo transactional email API.
 * Uses noreply@menuvo.app as the sender address.
 *
 * @param options - Email options (to, subject, htmlBody)
 * @throws Error if email sending fails
 */
export async function sendEmail({
	to,
	subject,
	htmlBody,
}: SendEmailOptions): Promise<void> {
	const startTime = Date.now();

	try {
		const client = getBrevoClient();

		const message = new SendSmtpEmail();
		message.sender = {
			email: EMAIL_CONFIG.SENDER_EMAIL,
			name: EMAIL_CONFIG.SENDER_NAME,
		};
		message.to = [{ email: to }];
		message.subject = subject;
		message.htmlContent = htmlBody;

		await client.sendTransacEmail(message);

		const duration = Date.now() - startTime;
		emailLogger.info({ to, subject, duration }, "Email sent successfully");
	} catch (err) {
		const duration = Date.now() - startTime;
		emailLogger.error({ err, to, subject, duration }, "Failed to send email");
		throw err;
	}
}
