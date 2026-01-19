import { emailLogger } from "../../lib/logger";
import { getEmailTransporter } from "./client";
import { EMAIL_CONFIG } from "./config";
import type { SendEmailOptions } from "./types";

/**
 * Send an email using nodemailer SMTP.
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
		const transporter = getEmailTransporter();

		await transporter.sendMail({
			from: `"${EMAIL_CONFIG.SENDER_NAME}" <${EMAIL_CONFIG.SENDER_EMAIL}>`,
			to,
			subject,
			html: htmlBody,
		});

		const duration = Date.now() - startTime;
		emailLogger.info({ to, subject, duration }, "Email sent successfully");
	} catch (err) {
		const duration = Date.now() - startTime;
		emailLogger.error({ err, to, subject, duration }, "Failed to send email");
		throw err;
	}
}
