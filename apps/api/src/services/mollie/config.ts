import { env } from "../../env";

/**
 * Centralized Mollie configuration.
 * All hardcoded values and environment-based settings in one place.
 */
export const MOLLIE_CONFIG = {
	/** Default country code for Mollie Client Links */
	DEFAULT_COUNTRY: "DE",

	/** Webhook path for Mollie events */
	WEBHOOK_PATH: "/webhooks/mollie",

	/** Maximum retry attempts for event processing */
	MAX_EVENT_RETRIES: 3,

	/** Token refresh buffer in milliseconds (5 minutes) */
	TOKEN_REFRESH_BUFFER_MS: 5 * 60 * 1000,
} as const;

/**
 * Check if Mollie is in test mode.
 * Defaults to true for safety (test mode by default).
 */
export function isTestMode(): boolean {
	return env.MOLLIE_TEST_MODE ?? true;
}

/**
 * Get the server URL with fallback.
 * Used for building webhook URLs and redirect URLs.
 */
export function getServerUrl(): string {
	return env.SERVER_URL || "https://www.menuvo.app";
}

/**
 * Build the webhook URL for Mollie.
 */
export function getWebhookUrl(): string {
	return `${getServerUrl()}${MOLLIE_CONFIG.WEBHOOK_PATH}`;
}
