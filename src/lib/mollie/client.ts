import createMollieClient from "@mollie/api-client";
import { env } from "@/env";

type MollieClientInstance = ReturnType<typeof createMollieClient>;

let mollieClient: MollieClientInstance | null = null;

/**
 * Get the Mollie client instance (singleton).
 * Uses T3 Env to access MOLLIE_API_KEY.
 *
 * @throws Error if MOLLIE_API_KEY is not configured
 */
export function getMollieClient(): MollieClientInstance {
	if (!mollieClient) {
		const apiKey = env.MOLLIE_API_KEY;
		if (!apiKey) {
			throw new Error(
				"MOLLIE_API_KEY is not configured. Please set the MOLLIE_API_KEY environment variable.",
			);
		}
		mollieClient = createMollieClient({ apiKey });
	}
	return mollieClient;
}

export type MollieClient = MollieClientInstance;
