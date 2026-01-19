import { createTransport, type Transporter } from "nodemailer";
import { getSmtpConfig } from "./config";

let transporter: Transporter | null = null;

/**
 * Get the nodemailer transporter instance (singleton).
 * Uses SMTP authentication.
 *
 * @throws Error if SMTP credentials are not configured
 */
export function getEmailTransporter(): Transporter {
	if (!transporter) {
		const config = getSmtpConfig();
		transporter = createTransport({
			host: config.host,
			port: config.port,
			secure: config.port === 465,
			auth: {
				user: config.user,
				pass: config.password,
			},
		});
	}
	return transporter;
}
