/**
 * Mollie Adapter
 *
 * Domain-specific adapter for Mollie payment provider.
 * Consolidates all Mollie API interactions for the payments domains.
 */

import { db } from "@menuvo/db";
import { merchants, orders } from "@menuvo/db/schema";
import createMollieClient, { Locale, type Payment } from "@mollie/api-client";
import { eq } from "drizzle-orm";
import { config } from "../../config.js";
import { env } from "../../env.js";
import { decryptToken, encryptToken } from "../../lib/crypto.js";
import { mollieLogger } from "../../lib/logger.js";

// =============================================================================
// Types
// =============================================================================

export type Amount = {
	currency: string;
	value: string;
};

export type MolliePaymentStatus =
	| "open"
	| "pending"
	| "authorized"
	| "paid"
	| "expired"
	| "failed"
	| "canceled";

export type CreateClientLinkInput = {
	name: string;
	email: string;
	state?: string;
};

export type CreateClientLinkOutput = {
	clientLinkId: string;
	onboardingUrl: string;
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

export type CreatePaymentInput = {
	orderId: string;
	storeId: string;
	amount: Amount;
	description: string;
	redirectUrl: string;
	webhookUrl?: string;
	applicationFee?: { amount: Amount; description: string };
};

export type CreatePaymentOutput = {
	paymentId: string;
	checkoutUrl: string | undefined;
};

export type EnablePaymentMethodsResult = {
	enabled: string[];
	failed: Array<{ method: string; error: string }>;
};

// =============================================================================
// Config
// =============================================================================

const MOLLIE_TOKEN_ENDPOINT = "https://api.mollie.com/oauth2/tokens";
const MOLLIE_CLIENT_LINKS_ENDPOINT = "https://api.mollie.com/v2/client-links";
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const DEFAULT_PAYMENT_METHODS = ["creditcard", "applepay"] as const;

export const MOLLIE_CONFIG = {
	DEFAULT_COUNTRY: "DE",
	WEBHOOK_PATH: "/webhooks/mollie",
	MAX_EVENT_RETRIES: 3,
	TOKEN_REFRESH_BUFFER_MS: 5 * 60 * 1000,
} as const;

export function isTestMode(): boolean {
	return env.MOLLIE_TEST_MODE ?? true;
}

export function getServerUrl(): string {
	return env.SERVER_URL;
}

export function getWebhookUrl(): string {
	return `${getServerUrl()}${MOLLIE_CONFIG.WEBHOOK_PATH}`;
}

// =============================================================================
// Client
// =============================================================================

type MollieClientInstance = ReturnType<typeof createMollieClient>;
let mollieClient: MollieClientInstance | null = null;

export function getMollieClient(): MollieClientInstance {
	if (!mollieClient) {
		const apiKey = env.MOLLIE_API_KEY;
		if (!apiKey) {
			throw new Error("MOLLIE_API_KEY is not configured");
		}
		mollieClient = createMollieClient({ apiKey });
	}
	return mollieClient;
}

export function createMollieClientWithToken(accessToken: string) {
	return createMollieClient({ accessToken });
}

export type MollieClient = MollieClientInstance;

// =============================================================================
// OAuth / Connect
// =============================================================================

export async function createClientLink(
	input: CreateClientLinkInput,
): Promise<CreateClientLinkOutput> {
	const clientId = env.MOLLIE_CLIENT_ID;
	const orgToken = env.MOLLIE_ORG_ACCESS_TOKEN;

	if (!clientId) {
		throw new Error("MOLLIE_CLIENT_ID is required for Client Links API");
	}

	if (!orgToken) {
		throw new Error("MOLLIE_ORG_ACCESS_TOKEN is required for Client Links API");
	}

	mollieLogger.info(
		{ name: input.name, email: input.email },
		"Creating Mollie client link",
	);

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
			{ status: response.status, body: errorBody },
			"Failed to create client link",
		);
		throw new Error(`Mollie Client Links API error: ${response.statusText}`);
	}

	const data = (await response.json()) as {
		id: string;
		_links: { clientLink: { href: string } };
	};

	const redirectUri = env.MOLLIE_REDIRECT_URI;
	if (!redirectUri) {
		throw new Error("MOLLIE_REDIRECT_URI is required");
	}

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

	const onboardingUrl = `${data._links.clientLink.href}?${oauthParams.toString()}`;

	mollieLogger.info({ clientLinkId: data.id }, "Client link created");

	return {
		clientLinkId: data.id,
		onboardingUrl,
	};
}

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
			{ status: response.status, body: errorBody },
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

	mollieLogger.info({ expiresIn: data.expires_in }, "Tokens obtained");

	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresIn: data.expires_in,
	};
}

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
			{ status: response.status, body: errorBody },
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

	mollieLogger.info({ expiresIn: data.expires_in }, "Access token refreshed");

	return {
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
		expiresIn: data.expires_in,
	};
}

export async function getOnboardingStatus(
	accessToken: string,
): Promise<OnboardingStatus> {
	mollieLogger.info("Fetching onboarding status");

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
		_links?: { dashboard?: { href: string } };
	};

	mollieLogger.info(
		{
			status: data.status,
			canReceivePayments: data.canReceivePayments,
		},
		"Onboarding status fetched",
	);

	return {
		canReceivePayments: data.canReceivePayments,
		canReceiveSettlements: data.canReceiveSettlements,
		status: data.status,
		dashboardUrl: data._links?.dashboard?.href,
	};
}

/**
 * Get a valid access token, refreshing if needed.
 * Extracted for reuse in service methods that don't need a full client.
 */
export async function getValidAccessToken(
	merchantId: string,
	encryptedAccessToken: string,
	encryptedRefreshToken: string,
	tokenExpiresAt: Date | null,
	database: typeof db,
): Promise<string> {
	// Decrypt tokens from DB
	const accessToken = await decryptToken(encryptedAccessToken);
	const refreshToken = await decryptToken(encryptedRefreshToken);

	const now = new Date();
	const needsRefresh =
		!tokenExpiresAt ||
		tokenExpiresAt.getTime() - now.getTime() < TOKEN_REFRESH_BUFFER_MS;

	if (needsRefresh) {
		mollieLogger.info({ merchantId }, "Refreshing Mollie access token");

		const newTokens = await refreshAccessToken(refreshToken);
		const newExpiresAt = new Date(Date.now() + newTokens.expiresIn * 1000);

		// Encrypt new tokens before storing
		const newEncryptedAccessToken = await encryptToken(newTokens.accessToken);
		const newEncryptedRefreshToken = await encryptToken(newTokens.refreshToken);

		await database
			.update(merchants)
			.set({
				mollieAccessToken: newEncryptedAccessToken,
				mollieRefreshToken: newEncryptedRefreshToken,
				mollieTokenExpiresAt: newExpiresAt,
			})
			.where(eq(merchants.id, merchantId));

		mollieLogger.info({ merchantId }, "Mollie tokens refreshed");

		return newTokens.accessToken;
	}

	return accessToken;
}

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

	const accessToken = await getValidAccessToken(
		merchantId,
		merchant.mollieAccessToken,
		merchant.mollieRefreshToken,
		merchant.mollieTokenExpiresAt,
		db,
	);

	return createMollieClientWithToken(accessToken);
}

export async function storeMerchantTokens(
	merchantId: string,
	tokens: OAuthTokens,
): Promise<void> {
	mollieLogger.info({ merchantId }, "Storing Mollie tokens for merchant");

	const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

	// Encrypt tokens before storing
	const encryptedAccessToken = await encryptToken(tokens.accessToken);
	const encryptedRefreshToken = await encryptToken(tokens.refreshToken);

	await db
		.update(merchants)
		.set({
			mollieAccessToken: encryptedAccessToken,
			mollieRefreshToken: encryptedRefreshToken,
			mollieTokenExpiresAt: expiresAt,
		})
		.where(eq(merchants.id, merchantId));

	mollieLogger.info({ merchantId, expiresAt }, "Mollie tokens stored");
}

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

// =============================================================================
// Payments
// =============================================================================

export async function createPayment(
	input: CreatePaymentInput,
): Promise<CreatePaymentOutput> {
	// Infer merchantId from orderId (security: never from input)
	const order = await db.query.orders.findFirst({
		where: eq(orders.id, input.orderId),
		columns: { merchantId: true },
		with: {
			store: {
				columns: { id: true },
				with: {
					merchant: {
						columns: {
							id: true,
							mollieProfileId: true,
							mollieAccessToken: true,
						},
					},
				},
			},
		},
	});

	if (!order) {
		throw new Error("Order not found");
	}

	const merchantId = order.merchantId;
	const merchant = order.store.merchant;

	if (!merchant) {
		throw new Error("Merchant not found for order");
	}

	if (!merchant.mollieAccessToken) {
		throw new Error(
			"Mollie payment account not connected. Please complete Mollie onboarding in settings.",
		);
	}

	// Get merchant Mollie client (uses OAuth tokens)
	const mollie = await getMerchantMollieClient(merchantId);
	const testMode = isTestMode();

	// Handle missing profileId: fetch from Mollie API if null
	let profileId = merchant.mollieProfileId;
	if (!profileId) {
		mollieLogger.info(
			{ merchantId },
			"ProfileId missing, fetching from Mollie API",
		);
		const profiles = await mollie.profiles.page();
		profileId = profiles.length > 0 ? (profiles[0]?.id ?? null) : null;

		if (!profileId) {
			throw new Error(
				"No payment profile found. Please complete Mollie onboarding.",
			);
		}

		// Update merchant record with fetched profileId for future use
		await db
			.update(merchants)
			.set({ mollieProfileId: profileId })
			.where(eq(merchants.id, merchantId));

		mollieLogger.info(
			{ merchantId, profileId },
			"Updated merchant with profileId",
		);
	}

	const payment = await mollie.payments.create({
		amount: input.amount,
		description: input.description,
		redirectUrl: input.redirectUrl,
		locale: Locale.de_DE,
		metadata: {
			orderId: String(input.orderId),
			storeId: String(input.storeId),
		},
		profileId, // Always include when using OAuth tokens (mandatory)
		applicationFee: input.applicationFee,
		...(input.webhookUrl && { webhookUrl: input.webhookUrl }),
		...(testMode && { testmode: true }),
	});

	return {
		paymentId: payment.id,
		checkoutUrl: payment._links.checkout?.href,
	};
}

export async function getPayment(orderId: string): Promise<Payment> {
	// Infer merchantId and paymentId from orderId
	const order = await db.query.orders.findFirst({
		where: eq(orders.id, orderId),
		columns: { merchantId: true, molliePaymentId: true },
	});

	if (!order) {
		throw new Error("Order not found");
	}

	const merchantId = order.merchantId;
	const paymentId = order.molliePaymentId;

	if (!paymentId) {
		throw new Error("Payment ID not found for order");
	}

	// Get merchant Mollie client (uses OAuth tokens)
	const mollie = await getMerchantMollieClient(merchantId);
	const testMode = isTestMode();

	return mollie.payments.get(paymentId, { testmode: testMode });
}

export async function cancelPayment(orderId: string): Promise<boolean> {
	// Infer merchantId and paymentId from orderId
	const order = await db.query.orders.findFirst({
		where: eq(orders.id, orderId),
		columns: { merchantId: true, molliePaymentId: true },
	});

	if (!order) {
		throw new Error("Order not found");
	}

	const merchantId = order.merchantId;
	const paymentId = order.molliePaymentId;

	if (!paymentId) {
		throw new Error("Payment ID not found for order");
	}

	// Get merchant Mollie client (uses OAuth tokens)
	const mollie = await getMerchantMollieClient(merchantId);
	const testMode = isTestMode();

	await mollie.payments.cancel(paymentId, { testmode: testMode });
	return true;
}
