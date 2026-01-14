import {
	TransactionalEmailsApi,
	TransactionalEmailsApiApiKeys,
} from "@getbrevo/brevo";
import { getApiKey } from "./config";

let brevoClient: TransactionalEmailsApi | null = null;

/**
 * Get the Brevo transactional email client instance (singleton).
 * Uses API key authentication.
 *
 * @throws Error if BREVO_API_KEY is not configured
 */
export function getBrevoClient(): TransactionalEmailsApi {
	if (!brevoClient) {
		brevoClient = new TransactionalEmailsApi();
		brevoClient.setApiKey(TransactionalEmailsApiApiKeys.apiKey, getApiKey());
	}
	return brevoClient;
}
