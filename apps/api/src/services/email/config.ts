import { env } from "../../env";

export const EMAIL_CONFIG = {
	/** Primary mailbox address (used to access the mailbox via Graph API) */
	MAILBOX_EMAIL: "merchant@menuvo.app",

	/** Sender address (alias on the mailbox, shown as "from" in emails) */
	SENDER_EMAIL: "noreply@menuvo.app",

	/** Graph API scope */
	GRAPH_SCOPE: "https://graph.microsoft.com/.default",
} as const;

/** Get the Azure AD Tenant ID */
export function getTenantId(): string {
	const tenantId = env.EMAIL_TENANT_ID;
	if (!tenantId) {
		throw new Error("EMAIL_TENANT_ID is not configured");
	}
	return tenantId;
}

/** Get the Azure AD Client ID */
export function getClientId(): string {
	const clientId = env.EMAIL_CLIENT_ID;
	if (!clientId) {
		throw new Error("EMAIL_CLIENT_ID is not configured");
	}
	return clientId;
}

/** Get the Azure AD Client Secret */
export function getClientSecret(): string {
	const clientSecret = env.EMAIL_CLIENT_SECRET;
	if (!clientSecret) {
		throw new Error("EMAIL_CLIENT_SECRET is not configured");
	}
	return clientSecret;
}
