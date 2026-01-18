import { OpenRouter } from "@openrouter/sdk";
import { env } from "../../env";

let openRouterClient: OpenRouter | null = null;

/**
 * Get the OpenRouter client instance (singleton).
 * Uses T3 Env to access OPENROUTER_API_KEY.
 */
export function getOpenRouterClient(): OpenRouter {
	if (!openRouterClient) {
		openRouterClient = new OpenRouter({
			apiKey: env.OPENROUTER_API_KEY,
		});
	}
	return openRouterClient;
}

export type { OpenRouter };
