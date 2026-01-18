import type { Locale } from "../types";

export type { Locale };

/**
 * Escape HTML special characters to prevent XSS in email templates.
 * Use this for any user-provided content.
 */
export function escapeHtml(unsafe: string): string {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

/**
 * Base email template wrapper.
 * Features inject their content into this wrapper for consistent branding.
 *
 * @param content - HTML content to inject into the template body
 * @returns Complete HTML email
 */
export function wrapWithBaseTemplate(content: string): string {
	return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Menuvo</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse: collapse;}
    .button {padding: 14px 32px !important;}
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e1393b 0%,#ff6b6b 100%);padding:32px;text-align:center;">
              <img src="https://menuvo.app/menuvo-logo-white.svg" alt="Menuvo" height="32" style="height:32px;width:auto;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;text-align:center;color:#6b7280;font-size:12px;line-height:1.5;">
              <p style="margin:0 0 8px 0;">&copy; ${new Date().getFullYear()} Menuvo. All rights reserved.</p>
              <p style="margin:0;color:#9ca3af;">
                <a href="https://menuvo.app" style="color:#6b7280;text-decoration:none;">menuvo.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Reusable inline styles for template content */
export const EMAIL_STYLES = {
	button: `display:inline-block;background:linear-gradient(135deg,#e1393b 0%,#ff6b6b 100%);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;`,
	heading: `margin:0 0 16px 0;font-size:24px;font-weight:700;color:#111827;line-height:1.3;`,
	paragraph: `margin:0 0 24px 0;color:#4b5563;font-size:16px;line-height:1.6;`,
	smallText: `margin:24px 0 0 0;color:#6b7280;font-size:14px;line-height:1.6;`,
} as const;

/**
 * Helper to create a CTA button in emails.
 * Use inside template content.
 */
export function createButton(href: string, text: string): string {
	return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
  <tr>
    <td>
      <a href="${href}" style="${EMAIL_STYLES.button}" target="_blank">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}
