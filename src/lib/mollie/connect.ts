import createMollieClient from "@mollie/api-client";
import { eq } from "drizzle-orm";
import { config } from "@/config";
import { db } from "@/db";
import { merchants } from "@/db/schema";
import { env } from "@/env";
import { decryptToken, encryptToken } from "@/lib/crypto";
import { mollieLogger } from "@/lib/logger";

// Mollie OAuth endpoints
const MOLLIE_TOKEN_ENDPOINT = "https://api.mollie.com/oauth2/tokens";

// Client Links API endpoint
const MOLLIE_CLIENT_LINKS_ENDPOINT = "https://api.mollie.com/v2/client-links";

// Types
export type CreateClientLinkInput = {
	name: string;
	email: string;
	state?: string; // OAuth state parameter for CSRF protection
};

export type CreateClientLinkOutput = {
	clientLinkId: string;
	onboardingUrl: string; // Full URL with OAuth params - redirect user here
};

export type OAuthTokens = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
};

export type OnboardingStatus = {
	canReceivePayments: boolean;
	canReceiveSettlements: boolean;
	status: string;
	dashboardUrl?: string;
};

/**
 * Creates a client link for co-branded merchant onboarding.
 * This allows merchants to sign up for Mollie through our platform.
 *
 * Uses Organization Access Token with clients.write permission.
 *
 * @see https://docs.mollie.com/reference/v2/client-links-api/create-client-link
 */
export async function createClientLink(
	input: CreateClientLinkInput,
): Promise<CreateClientLinkOutput> {
	const clientId = env.MOLLIE_CLIENT_ID;
	const orgToken = env.MOLLIE_ORG_ACCESS_TOKEN;

	if (!clientId) {
		throw new Error("MOLLIE_CLIENT_ID is required for Client Links API");
	}

	if (!orgToken) {
		throw new Error(
			"MOLLIE_ORG_ACCESS_TOKEN is required for Client Links API. Create one in Mollie Dashboard → Developers → Organization access tokens with 'clients.write' permission.",
		);
	}

	mollieLogger.info(
		{ name: input.name, email: input.email },
		"Creating Mollie client link",
	);

	try {
		// Client Links API uses Organization Access Token (Bearer auth)
		// NOTE: Client Links API is live-only, no testmode parameter
		const response = await fetch(MOLLIE_CLIENT_LINKS_ENDPOINT, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${orgToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				owner: {
					email: input.email,
					givenName: input.name.split(" ")[0] || input.name,
					familyName: input.name.split(" ").slice(1).join(" ") || input.name,
					locale: config.defaultLocale,
				},
				name: input.name,
				address: {
					country: "DE",
				},
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			mollieLogger.error(
				{
					status: response.status,
					statusText: response.statusText,
					body: errorBody,
				},
				"Failed to create client link",
			);
			throw new Error(`Mollie Client Links API error: ${response.statusText}`);
		}

		const data = (await response.json()) as {
			id: string;
			_links: {
				clientLink: { href: string };
			};
		};

		const redirectUri = env.MOLLIE_REDIRECT_URI;
		if (!redirectUri) {
			throw new Error("MOLLIE_REDIRECT_URI is required");
		}

		// Build OAuth params to append to client link URL
		const oauthParams = new URLSearchParams({
			client_id: clientId,
			redirect_uri: redirectUri,
			response_type: "code",
			scope:
				"payments.read payments.write profiles.read organizations.read onboarding.read onboarding.write",
			approval_prompt: "auto",
		});

		if (input.state) {
			oauthParams.set("state", input.state);
		}

		// Append OAuth params to client link URL
		const onboardingUrl = `${data._links.clientLink.href}?${oauthParams.toString()}`;

		mollieLogger.info(
			{ clientLinkId: data.id, onboardingUrl },
			"Client link created successfully",
		);

		return {
			clientLinkId: data.id,
			onboardingUrl,
		};
	} catch (error) {
		mollieLogger.error(
			{
				name: input.name,
				email: input.email,
				error: error instanceof Error ? error.message : String(error),
			},
			"Failed to create client link",
		);
		throw error;
	}
}

/**
 * Exchanges an authorization code for access and refresh tokens.
 *
 * @param code - The authorization code from OAuth callback
 */
export async function exchangeCodeForTokens(
	code: string,
): Promise<OAuthTokens> {
	const clientId = env.MOLLIE_CLIENT_ID;
	const clientSecret = env.MOLLIE_CLIENT_SECRET;
	const redirectUri = env.MOLLIE_REDIRECT_URI;

	if (!clientId || !clientSecret) {
		throw new Error(
			"MOLLIE_CLIENT_ID and MOLLIE_CLIENT_SECRET are required for token exchange",
		);
	}
	if (!redirectUri) {
		throw new Error("MOLLIE_REDIRECT_URI is required for token exchange");
	}

	mollieLogger.info("Exchanging authorization code for tokens");

	try {
		const response = await fetch(MOLLIE_TOKEN_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				code,
				redirect_uri: redirectUri,
				client_id: clientId,
				client_secret: clientSecret,
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			mollieLogger.error(
				{
					status: response.status,
					statusText: response.statusText,
					body: errorBody,
				},
				"Failed to exchange code for tokens",
			);
			throw new Error(`Mollie OAuth token error: ${response.statusText}`);
		}

		const data = (await response.json()) as {
			access_token: string;
			refresh_token: string;
			expires_in: number;
			token_type: string;
			scope: string;
		};

		mollieLogger.info(
			{ expiresIn: data.expires_in, scope: data.scope },
			"Tokens obtained successfully",
		);

		return {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresIn: data.expires_in,
		};
	} catch (error) {
		mollieLogger.error(
			{
				error: error instanceof Error ? error.message : String(error),
			},
			"Failed to exchange code for tokens",
		);
		throw error;
	}
}

/**
 * Refreshes an access token using a refresh token.
 *
 * @param refreshToken - The refresh token from previous token exchange
 */
export async function refreshAccessToken(
	refreshToken: string,
): Promise<OAuthTokens> {
	const clientId = env.MOLLIE_CLIENT_ID;
	const clientSecret = env.MOLLIE_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new Error(
			"MOLLIE_CLIENT_ID and MOLLIE_CLIENT_SECRET are required for token refresh",
		);
	}

	mollieLogger.info("Refreshing access token");

	try {
		const response = await fetch(MOLLIE_TOKEN_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token: refreshToken,
				client_id: clientId,
				client_secret: clientSecret,
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			mollieLogger.error(
				{
					status: response.status,
					statusText: response.statusText,
					body: errorBody,
				},
				"Failed to refresh access token",
			);
			throw new Error(`Mollie OAuth refresh error: ${response.statusText}`);
		}

		const data = (await response.json()) as {
			access_token: string;
			refresh_token: string;
			expires_in: number;
			token_type: string;
			scope: string;
		};

		mollieLogger.info(
			{ expiresIn: data.expires_in },
			"Access token refreshed successfully",
		);

		return {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresIn: data.expires_in,
		};
	} catch (error) {
		mollieLogger.error(
			{
				error: error instanceof Error ? error.message : String(error),
			},
			"Failed to refresh access token",
		);
		throw error;
	}
}

/**
 * Creates a Mollie client authenticated with an access token.
 * Use this for operations on behalf of a connected merchant (M2M).
 *
 * @param accessToken - The OAuth access token for the merchant
 */
export function createMollieClientWithToken(accessToken: string) {
	return createMollieClient({ accessToken });
}

/**
 * Gets the onboarding status for a connected merchant.
 * Uses the onboarding API to get status and dashboard link.
 *
 * NOTE: No testmode parameter - Client Links creates LIVE organizations,
 * so OAuth tokens are for live mode. Onboarding API is always live.
 *
 * @param accessToken - The OAuth access token for the merchant
 */
export async function getOnboardingStatus(
	accessToken: string,
): Promise<OnboardingStatus> {
	mollieLogger.info("Fetching onboarding status");

	try {
		// Call onboarding API directly to get dashboard link
		// No testmode - Client Links orgs are always live
		const response = await fetch("https://api.mollie.com/v2/onboarding/me", {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!response.ok) {
			const errorBody = await response.text();
			mollieLogger.error(
				{ status: response.status, body: errorBody },
				"Failed to fetch onboarding status",
			);
			throw new Error(`Mollie onboarding API error: ${response.statusText}`);
		}

		const data = (await response.json()) as {
			status: "needs-data" | "in-review" | "completed";
			canReceivePayments: boolean;
			canReceiveSettlements: boolean;
			_links?: {
				dashboard?: { href: string };
			};
		};

		mollieLogger.info(
			{
				status: data.status,
				canReceivePayments: data.canReceivePayments,
				canReceiveSettlements: data.canReceiveSettlements,
				dashboardUrl: data._links?.dashboard?.href,
			},
			"Onboarding status fetched successfully",
		);

		return {
			canReceivePayments: data.canReceivePayments,
			canReceiveSettlements: data.canReceiveSettlements,
			status: data.status,
			dashboardUrl: data._links?.dashboard?.href,
		};
	} catch (error) {
		mollieLogger.error(
			{
				error: error instanceof Error ? error.message : String(error),
			},
			"Failed to fetch onboarding status",
		);
		throw error;
	}
}

// Buffer time before token expiry (5 minutes)
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * Gets a Mollie client for a merchant with automatic token refresh.
 * This is the main function for M2M operations on behalf of a merchant.
 *
 * - Checks if token is expired or expiring soon
 * - Automatically refreshes tokens if needed
 * - Returns a configured Mollie client with the merchant's access token
 *
 * @param merchantId - The merchant's database ID
 */
export async function getMerchantMollieClient(merchantId: string) {
	mollieLogger.debug({ merchantId }, "Getting Mollie client for merchant");

	const merchant = await db.query.merchants.findFirst({
		where: eq(merchants.id, merchantId),
		columns: {
			id: true,
			mollieAccessToken: true,
			mollieRefreshToken: true,
			mollieTokenExpiresAt: true,
		},
	});

	if (!merchant?.mollieAccessToken || !merchant?.mollieRefreshToken) {
		throw new Error("Merchant does not have Mollie OAuth tokens configured");
	}

	// Check if token is expired or expiring soon
	const now = new Date();
	const expiresAt = merchant.mollieTokenExpiresAt;
	const needsRefresh =
		!expiresAt || expiresAt.getTime() - now.getTime() < TOKEN_REFRESH_BUFFER_MS;

	if (needsRefresh) {
		mollieLogger.info({ merchantId }, "Refreshing Mollie access token");

		try {
			// Decrypt the refresh token
			const refreshToken = await decryptToken(merchant.mollieRefreshToken);

			// Get new tokens
			const newTokens = await refreshAccessToken(refreshToken);

			// Encrypt new tokens
			const encryptedAccessToken = await encryptToken(newTokens.accessToken);
			const encryptedRefreshToken = await encryptToken(newTokens.refreshToken);
			const newExpiresAt = new Date(Date.now() + newTokens.expiresIn * 1000);

			// Update merchant with new tokens
			await db
				.update(merchants)
				.set({
					mollieAccessToken: encryptedAccessToken,
					mollieRefreshToken: encryptedRefreshToken,
					mollieTokenExpiresAt: newExpiresAt,
				})
				.where(eq(merchants.id, merchantId));

			mollieLogger.info(
				{ merchantId, expiresAt: newExpiresAt },
				"Mollie tokens refreshed successfully",
			);

			return createMollieClientWithToken(newTokens.accessToken);
		} catch (error) {
			mollieLogger.error(
				{
					merchantId,
					error: error instanceof Error ? error.message : String(error),
				},
				"Failed to refresh Mollie tokens",
			);
			throw error;
		}
	}

	// Token is valid, decrypt and use
	const accessToken = await decryptToken(merchant.mollieAccessToken);
	return createMollieClientWithToken(accessToken);
}

/**
 * Stores OAuth tokens for a merchant with encryption.
 *
 * @param merchantId - The merchant's database ID
 * @param tokens - The OAuth tokens to store
 */
export async function storeMerchantTokens(
	merchantId: string,
	tokens: OAuthTokens,
): Promise<void> {
	mollieLogger.info({ merchantId }, "Storing Mollie tokens for merchant");

	// Encrypt tokens
	const encryptedAccessToken = await encryptToken(tokens.accessToken);
	const encryptedRefreshToken = await encryptToken(tokens.refreshToken);
	const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

	await db
		.update(merchants)
		.set({
			mollieAccessToken: encryptedAccessToken,
			mollieRefreshToken: encryptedRefreshToken,
			mollieTokenExpiresAt: expiresAt,
		})
		.where(eq(merchants.id, merchantId));

	mollieLogger.info(
		{ merchantId, expiresAt },
		"Mollie tokens stored successfully",
	);
}

// Default payment methods to enable for new merchants
// - creditcard: includes Google Pay automatically on compatible devices
// - applepay: Apple Pay (separate method)
const DEFAULT_PAYMENT_METHODS = ["creditcard", "applepay"] as const;

export type EnablePaymentMethodsResult = {
	enabled: string[];
	failed: Array<{ method: string; error: string }>;
};

/**
 * Enable default payment methods on a merchant's Mollie profile.
 * This is called after OAuth completion to set up standard payment methods.
 *
 * Uses Promise.allSettled to attempt all methods regardless of individual failures.
 * Does not throw - returns a result object showing which methods succeeded/failed.
 *
 * @param mollieClient - Authenticated Mollie client (with merchant's access token)
 * @param profileId - The merchant's Mollie profile ID
 */
export async function enableDefaultPaymentMethods(
	mollieClient: ReturnType<typeof createMollieClient>,
	profileId: string,
): Promise<EnablePaymentMethodsResult> {
	mollieLogger.info(
		{ profileId, methods: DEFAULT_PAYMENT_METHODS },
		"Enabling default payment methods",
	);

	const results = await Promise.allSettled(
		DEFAULT_PAYMENT_METHODS.map(async (method) => {
			try {
				await mollieClient.profileMethods.enable({
					profileId,
					id: method,
				});
				mollieLogger.info({ profileId, method }, "Payment method enabled");
				return { method, success: true as const };
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				mollieLogger.warn(
					{ profileId, method, error: errorMessage },
					"Failed to enable payment method",
				);
				throw { method, error: errorMessage };
			}
		}),
	);

	const enabled: string[] = [];
	const failed: Array<{ method: string; error: string }> = [];

	for (const result of results) {
		if (result.status === "fulfilled") {
			enabled.push(result.value.method);
		} else {
			const reason = result.reason as { method: string; error: string };
			failed.push(reason);
		}
	}

	mollieLogger.info(
		{ profileId, enabled, failed: failed.length },
		"Payment methods setup completed",
	);

	return { enabled, failed };
}
