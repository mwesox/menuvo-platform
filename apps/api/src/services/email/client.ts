import { ClientSecretCredential } from "@azure/identity";
import { AzureIdentityAuthenticationProvider } from "@microsoft/kiota-authentication-azure";
import {
	createGraphServiceClient,
	GraphRequestAdapter,
} from "@microsoft/msgraph-sdk";
import "@microsoft/msgraph-sdk-users";
import {
	EMAIL_CONFIG,
	getClientId,
	getClientSecret,
	getTenantId,
} from "./config";

type GraphServiceClient = ReturnType<typeof createGraphServiceClient>;

let graphClient: GraphServiceClient | null = null;

/**
 * Get the Microsoft Graph client instance (singleton).
 * Uses Azure AD Client Secret authentication.
 *
 * @throws Error if email environment variables are not configured
 */
export function getGraphClient(): GraphServiceClient {
	if (!graphClient) {
		const credential = new ClientSecretCredential(
			getTenantId(),
			getClientId(),
			getClientSecret(),
		);

		const authProvider = new AzureIdentityAuthenticationProvider(credential, [
			EMAIL_CONFIG.GRAPH_SCOPE,
		]);

		const requestAdapter = new GraphRequestAdapter(authProvider);
		graphClient = createGraphServiceClient(requestAdapter);
	}
	return graphClient;
}

export type { GraphServiceClient };
