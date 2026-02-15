/**
 * PayPal Marketplace Adapter
 *
 * Domain-specific adapter for PayPal Marketplace Solutions.
 * Consolidates all PayPal API interactions for the payments domain.
 *
 * Key concepts:
 * - Partner (Platform): Our platform that facilitates payments
 * - Seller (Merchant): Restaurant owners who receive payments
 * - PayPal uses OAuth2 with client credentials for API access
 * - Marketplace payments use platform fees collected on each transaction
 */

import { env } from "../../env.js";
import { createLogger } from "../../lib/logger.js";

const paypalLogger = createLogger("paypal");

// =============================================================================
// Types
// =============================================================================

export interface Amount {
	value: string;
	currency_code: string;
}

export interface CreatePartnerReferralInput {
	merchantId: string;
	email: string;
	businessName: string;
	returnUrl: string;
}

export interface CreatePartnerReferralOutput {
	trackingId: string;
	onboardingUrl: string;
}

export interface MerchantStatus {
	merchantId: string;
	trackingId?: string;
	paymentsReceivable: boolean;
	primaryEmailConfirmed: boolean;
	oauthIntegrations: boolean;
	onboardingStatus: "pending" | "in_review" | "completed" | "not_connected";
}

export interface CreateOrderInput {
	orderId: string;
	amount: Amount;
	description: string;
	returnUrl: string;
	cancelUrl: string;
	sellerMerchantId: string;
	platformFee?: Amount;
}

export interface CreateOrderOutput {
	paypalOrderId: string;
	approvalUrl: string;
	status: string;
}

export interface CaptureOrderOutput {
	captureId: string;
	status: string;
	amount: Amount;
}

export interface OrderStatus {
	status: string;
	isPaid: boolean;
	isApproved: boolean;
	isCaptured: boolean;
	captureId?: string;
}

// =============================================================================
// Config
// =============================================================================

const PAYPAL_API_BASE =
	env.PAYPAL_MODE === "live"
		? "https://api-m.paypal.com"
		: "https://api-m.sandbox.paypal.com";

export const PAYPAL_CONFIG = {
	API_BASE: PAYPAL_API_BASE,
	WEBHOOK_PATH: "/webhooks/paypal",
	MAX_EVENT_RETRIES: 3,
	RETURN_PATH: "/api/paypal/return",
} as const;

export function isSandbox(): boolean {
	return env.PAYPAL_MODE === "sandbox";
}

export function getServerUrl(): string {
	return env.SERVER_URL;
}

export function getWebhookUrl(): string {
	return `${getServerUrl()}${PAYPAL_CONFIG.WEBHOOK_PATH}`;
}

// =============================================================================
// OAuth2 Access Token
// =============================================================================

let cachedAccessToken: { token: string; expiresAt: Date } | null = null;

/**
 * Get PayPal OAuth2 access token using client credentials.
 * Caches the token until it expires.
 */
export async function getAccessToken(): Promise<string> {
	// Return cached token if still valid (with 60s buffer)
	if (cachedAccessToken) {
		const bufferMs = 60 * 1000;
		if (cachedAccessToken.expiresAt.getTime() - Date.now() > bufferMs) {
			return cachedAccessToken.token;
		}
	}

	const clientId = env.PAYPAL_CLIENT_ID;
	const clientSecret = env.PAYPAL_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new Error("PayPal credentials not configured");
	}

	paypalLogger.info("Obtaining PayPal access token");

	const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

	const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
		method: "POST",
		headers: {
			Authorization: `Basic ${auth}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: "grant_type=client_credentials",
	});

	if (!response.ok) {
		const errorBody = await response.text();
		paypalLogger.error(
			{ status: response.status, body: errorBody },
			"Failed to obtain PayPal access token",
		);
		throw new Error(`PayPal OAuth error: ${response.statusText}`);
	}

	const data = (await response.json()) as {
		access_token: string;
		token_type: string;
		expires_in: number;
	};

	// Cache the token
	cachedAccessToken = {
		token: data.access_token,
		expiresAt: new Date(Date.now() + data.expires_in * 1000),
	};

	paypalLogger.info(
		{ expiresIn: data.expires_in },
		"PayPal access token obtained",
	);

	return data.access_token;
}

// =============================================================================
// Auth Assertion for Marketplace Operations
// =============================================================================

/**
 * Generate PayPal-Auth-Assertion header for marketplace operations.
 * This allows the platform to act on behalf of the seller.
 */
export function generateAuthAssertion(sellerMerchantId: string): string {
	const clientId = env.PAYPAL_CLIENT_ID;
	if (!clientId) {
		throw new Error("PAYPAL_CLIENT_ID is required");
	}

	// PayPal Auth Assertion is a JWT with specific claims
	const header = { alg: "none" };
	const payload = {
		iss: clientId,
		payer_id: sellerMerchantId,
	};

	const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
		"base64url",
	);
	const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
		"base64url",
	);

	// JWT with no signature (alg: none)
	return `${encodedHeader}.${encodedPayload}.`;
}

// =============================================================================
// Partner Referrals (Merchant Onboarding)
// =============================================================================

/**
 * Create a partner referral to onboard a new seller/merchant.
 * Returns a URL to redirect the merchant to for PayPal onboarding.
 */
export async function createPartnerReferral(
	input: CreatePartnerReferralInput,
): Promise<CreatePartnerReferralOutput> {
	const accessToken = await getAccessToken();
	const partnerId = env.PAYPAL_PARTNER_MERCHANT_ID;

	if (!partnerId) {
		throw new Error("PAYPAL_PARTNER_MERCHANT_ID is required");
	}

	paypalLogger.info(
		{ merchantId: input.merchantId, email: input.email },
		"Creating partner referral",
	);

	// Generate a tracking ID that we can use to identify this merchant
	const trackingId = `menuvo_${input.merchantId}`;

	const referralPayload = {
		tracking_id: trackingId,
		partner_config_override: {
			return_url: input.returnUrl,
		},
		operations: [
			{
				operation: "API_INTEGRATION",
				api_integration_preference: {
					rest_api_integration: {
						integration_method: "PAYPAL",
						integration_type: "THIRD_PARTY",
						third_party_details: {
							features: ["PAYMENT", "REFUND", "PARTNER_FEE"],
						},
					},
				},
			},
		],
		products: ["EXPRESS_CHECKOUT"],
		legal_consents: [
			{
				type: "SHARE_DATA_CONSENT",
				granted: true,
			},
		],
	};

	const response = await fetch(
		`${PAYPAL_API_BASE}/v2/customer/partner-referrals`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(referralPayload),
		},
	);

	if (!response.ok) {
		const errorBody = await response.text();
		paypalLogger.error(
			{ status: response.status, body: errorBody },
			"Failed to create partner referral",
		);
		throw new Error(`PayPal partner referral error: ${response.statusText}`);
	}

	const data = (await response.json()) as {
		links: Array<{ href: string; rel: string }>;
	};

	// Find the action_url link for onboarding
	const actionLink = data.links.find((link) => link.rel === "action_url");
	if (!actionLink) {
		throw new Error("PayPal did not return onboarding URL");
	}

	paypalLogger.info(
		{ merchantId: input.merchantId, trackingId },
		"Partner referral created",
	);

	return {
		trackingId,
		onboardingUrl: actionLink.href,
	};
}

/**
 * Get merchant onboarding/integration status from PayPal.
 */
export async function getMerchantStatus(
	sellerMerchantId: string,
	trackingId?: string,
): Promise<MerchantStatus> {
	const accessToken = await getAccessToken();
	const partnerId = env.PAYPAL_PARTNER_MERCHANT_ID;

	if (!partnerId) {
		throw new Error("PAYPAL_PARTNER_MERCHANT_ID is required");
	}

	paypalLogger.info({ sellerMerchantId }, "Fetching merchant status");

	const response = await fetch(
		`${PAYPAL_API_BASE}/v1/customer/partners/${partnerId}/merchant-integrations/${sellerMerchantId}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		if (response.status === 404) {
			paypalLogger.info(
				{ sellerMerchantId },
				"Merchant not found in PayPal - not onboarded yet",
			);
			return {
				merchantId: sellerMerchantId,
				trackingId,
				paymentsReceivable: false,
				primaryEmailConfirmed: false,
				oauthIntegrations: false,
				onboardingStatus: "not_connected",
			};
		}

		const errorBody = await response.text();
		paypalLogger.error(
			{ status: response.status, body: errorBody },
			"Failed to fetch merchant status",
		);
		throw new Error(`PayPal merchant status error: ${response.statusText}`);
	}

	const data = (await response.json()) as {
		merchant_id: string;
		tracking_id?: string;
		payments_receivable: boolean;
		primary_email_confirmed: boolean;
		oauth_integrations?: Array<{
			integration_type: string;
			oauth_third_party: Array<{ partner_client_id: string; scopes: string[] }>;
		}>;
	};

	// Determine onboarding status
	let onboardingStatus: MerchantStatus["onboardingStatus"] = "pending";
	if (data.payments_receivable && data.primary_email_confirmed) {
		onboardingStatus = "completed";
	} else if (data.payments_receivable || data.primary_email_confirmed) {
		onboardingStatus = "in_review";
	}

	const hasOAuthIntegration =
		data.oauth_integrations && data.oauth_integrations.length > 0;

	paypalLogger.info(
		{
			sellerMerchantId,
			paymentsReceivable: data.payments_receivable,
			primaryEmailConfirmed: data.primary_email_confirmed,
			onboardingStatus,
		},
		"Merchant status fetched",
	);

	return {
		merchantId: data.merchant_id,
		trackingId: data.tracking_id,
		paymentsReceivable: data.payments_receivable,
		primaryEmailConfirmed: data.primary_email_confirmed,
		oauthIntegrations: hasOAuthIntegration ?? false,
		onboardingStatus,
	};
}

// =============================================================================
// Orders (Payments)
// =============================================================================

/**
 * Create a PayPal order for checkout.
 * Returns an approval URL where the customer can complete payment.
 */
export async function createOrder(
	input: CreateOrderInput,
): Promise<CreateOrderOutput> {
	const accessToken = await getAccessToken();

	paypalLogger.info(
		{
			orderId: input.orderId,
			amount: input.amount,
			sellerMerchantId: input.sellerMerchantId,
		},
		"Creating PayPal order",
	);

	// Build the order payload
	const orderPayload: Record<string, unknown> = {
		intent: "CAPTURE",
		purchase_units: [
			{
				reference_id: input.orderId,
				description: input.description,
				amount: {
					currency_code: input.amount.currency_code,
					value: input.amount.value,
				},
				payee: {
					merchant_id: input.sellerMerchantId,
				},
				...(input.platformFee && {
					payment_instruction: {
						platform_fees: [
							{
								amount: {
									currency_code: input.platformFee.currency_code,
									value: input.platformFee.value,
								},
							},
						],
					},
				}),
			},
		],
		application_context: {
			return_url: input.returnUrl,
			cancel_url: input.cancelUrl,
			brand_name: "Menuvo",
			landing_page: "NO_PREFERENCE",
			user_action: "PAY_NOW",
		},
	};

	// Add BN code if configured
	const bnCode = env.PAYPAL_BN_CODE;
	const headers: Record<string, string> = {
		Authorization: `Bearer ${accessToken}`,
		"Content-Type": "application/json",
		"PayPal-Request-Id": input.orderId, // Idempotency key
	};

	if (bnCode) {
		headers["PayPal-Partner-Attribution-Id"] = bnCode;
	}

	const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
		method: "POST",
		headers,
		body: JSON.stringify(orderPayload),
	});

	if (!response.ok) {
		const errorBody = await response.text();
		paypalLogger.error(
			{ status: response.status, body: errorBody },
			"Failed to create PayPal order",
		);
		throw new Error(`PayPal order creation error: ${response.statusText}`);
	}

	const data = (await response.json()) as {
		id: string;
		status: string;
		links: Array<{ href: string; rel: string }>;
	};

	// Find the approval URL
	const approvalLink = data.links.find((link) => link.rel === "approve");
	if (!approvalLink) {
		throw new Error("PayPal did not return approval URL");
	}

	paypalLogger.info(
		{ paypalOrderId: data.id, status: data.status },
		"PayPal order created",
	);

	return {
		paypalOrderId: data.id,
		approvalUrl: approvalLink.href,
		status: data.status,
	};
}

/**
 * Capture a PayPal order after customer approval.
 * This actually processes the payment.
 */
export async function captureOrder(
	paypalOrderId: string,
	sellerMerchantId: string,
): Promise<CaptureOrderOutput> {
	const accessToken = await getAccessToken();

	paypalLogger.info(
		{ paypalOrderId, sellerMerchantId },
		"Capturing PayPal order",
	);

	// Generate auth assertion for marketplace capture
	const authAssertion = generateAuthAssertion(sellerMerchantId);

	const response = await fetch(
		`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
				"PayPal-Auth-Assertion": authAssertion,
				"PayPal-Request-Id": `capture_${paypalOrderId}`,
			},
		},
	);

	if (!response.ok) {
		const errorBody = await response.text();
		paypalLogger.error(
			{ status: response.status, body: errorBody, paypalOrderId },
			"Failed to capture PayPal order",
		);
		throw new Error(`PayPal capture error: ${response.statusText}`);
	}

	const data = (await response.json()) as {
		id: string;
		status: string;
		purchase_units: Array<{
			payments: {
				captures: Array<{
					id: string;
					status: string;
					amount: {
						currency_code: string;
						value: string;
					};
				}>;
			};
		}>;
	};

	const capture = data.purchase_units[0]?.payments?.captures[0];
	if (!capture) {
		throw new Error("PayPal capture response missing capture data");
	}

	paypalLogger.info(
		{ paypalOrderId, captureId: capture.id, status: capture.status },
		"PayPal order captured",
	);

	return {
		captureId: capture.id,
		status: capture.status,
		amount: {
			currency_code: capture.amount.currency_code,
			value: capture.amount.value,
		},
	};
}

/**
 * Get the status of a PayPal order.
 */
export async function getOrderStatus(
	paypalOrderId: string,
	sellerMerchantId?: string,
): Promise<OrderStatus> {
	const accessToken = await getAccessToken();

	paypalLogger.info({ paypalOrderId }, "Fetching PayPal order status");

	const headers: Record<string, string> = {
		Authorization: `Bearer ${accessToken}`,
		"Content-Type": "application/json",
	};

	// If seller merchant ID provided, add auth assertion
	if (sellerMerchantId) {
		headers["PayPal-Auth-Assertion"] = generateAuthAssertion(sellerMerchantId);
	}

	const response = await fetch(
		`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}`,
		{
			method: "GET",
			headers,
		},
	);

	if (!response.ok) {
		const errorBody = await response.text();
		paypalLogger.error(
			{ status: response.status, body: errorBody, paypalOrderId },
			"Failed to fetch PayPal order status",
		);
		throw new Error(`PayPal order status error: ${response.statusText}`);
	}

	const data = (await response.json()) as {
		id: string;
		status: string;
		purchase_units?: Array<{
			payments?: {
				captures?: Array<{
					id: string;
					status: string;
				}>;
			};
		}>;
	};

	const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

	const status: OrderStatus = {
		status: data.status,
		isPaid: data.status === "COMPLETED",
		isApproved: data.status === "APPROVED",
		isCaptured: capture?.status === "COMPLETED",
		captureId: capture?.id,
	};

	paypalLogger.info(
		{ paypalOrderId, status: data.status },
		"Order status fetched",
	);

	return status;
}

// =============================================================================
// Webhook Verification
// =============================================================================

/**
 * Verify PayPal webhook signature.
 * Note: For production, implement proper signature verification.
 */
export async function verifyWebhookSignature(
	headers: Record<string, string>,
	body: string,
): Promise<boolean> {
	const webhookId = env.PAYPAL_WEBHOOK_ID;

	if (!webhookId) {
		if (env.NODE_ENV === "production") {
			paypalLogger.error(
				"PAYPAL_WEBHOOK_ID not configured in production; rejecting webhook",
			);
			return false;
		}

		paypalLogger.warn(
			"PAYPAL_WEBHOOK_ID not configured, skipping verification in non-production",
		);
		return true;
	}

	const accessToken = await getAccessToken();

	const verificationPayload = {
		auth_algo: headers["paypal-auth-algo"],
		cert_url: headers["paypal-cert-url"],
		transmission_id: headers["paypal-transmission-id"],
		transmission_sig: headers["paypal-transmission-sig"],
		transmission_time: headers["paypal-transmission-time"],
		webhook_id: webhookId,
		webhook_event: JSON.parse(body),
	};

	const response = await fetch(
		`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(verificationPayload),
		},
	);

	if (!response.ok) {
		paypalLogger.error(
			{ status: response.status },
			"Webhook verification request failed",
		);
		return false;
	}

	const data = (await response.json()) as {
		verification_status: string;
	};

	const isValid = data.verification_status === "SUCCESS";

	if (!isValid) {
		paypalLogger.warn(
			{ status: data.verification_status },
			"Webhook verification failed",
		);
	}

	return isValid;
}
