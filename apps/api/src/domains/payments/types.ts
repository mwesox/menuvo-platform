/**
 * Payment Domain Types
 *
 * Provider-agnostic types for payment operations.
 */

/**
 * Amount in decimal string format with currency.
 */
export interface Amount {
	value: string;
	currency: string;
}

// =============================================================================
// ORDER PAYMENTS
// =============================================================================

/**
 * Input for creating a payment.
 * merchantId is inferred from orderId (never passed as input for security).
 */
export interface CreatePaymentInput {
	orderId: string;
	storeId: string;
	amount: Amount;
	description: string;
	redirectUrl: string;
}

/**
 * Result of creating a payment.
 */
export interface PaymentResult {
	paymentId: string;
	checkoutUrl: string;
}

/**
 * Payment status information.
 */
export interface PaymentStatus {
	status: string;
	isPaid: boolean;
	isFailed: boolean;
	isExpired: boolean;
}

// =============================================================================
// MERCHANT ONBOARDING
// =============================================================================

/**
 * Result of starting merchant onboarding.
 */
export interface OnboardingResult {
	onboardingUrl: string;
}

/**
 * Merchant onboarding status.
 */
export interface OnboardingStatus {
	connected: boolean;
	canReceivePayments: boolean;
	canReceiveSettlements: boolean;
	status: "needs-data" | "in-review" | "completed" | "not_connected" | string;
	dashboardUrl?: string;
}

/**
 * Full Mollie status from database.
 */
export interface MollieStatus {
	connected: boolean;
	organizationId: string | null;
	profileId: string | null;
	onboardingStatus: string | null;
	canReceivePayments: boolean;
	canReceiveSettlements: boolean;
}
