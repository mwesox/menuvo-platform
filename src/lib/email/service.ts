import { emailLogger } from "@/lib/logger";
import { getGraphClient } from "./client";
import { EMAIL_CONFIG } from "./config";
import type { SendEmailOptions } from "./types";

/**
 * Send an email using Microsoft Graph API.
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
		const client = getGraphClient();

		await client.users.byUserId(EMAIL_CONFIG.MAILBOX_EMAIL).sendMail.post({
			message: {
				subject,
				body: {
					contentType: "html",
					content: htmlBody,
				},
				from: {
					emailAddress: {
						address: EMAIL_CONFIG.SENDER_EMAIL,
					},
				},
				toRecipients: [
					{
						emailAddress: {
							address: to,
						},
					},
				],
			},
			saveToSentItems: false,
		});

		const duration = Date.now() - startTime;
		emailLogger.info({ to, subject, duration }, "Email sent successfully");
	} catch (err) {
		const duration = Date.now() - startTime;
		emailLogger.error({ err, to, subject, duration }, "Failed to send email");
		throw err;
	}
}
