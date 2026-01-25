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
	returnUrl: string;
	cancelUrl: string;
}

/**
 * Result of creating a payment.
 */
export interface PaymentResult {
	paymentId: string;
	approvalUrl: string;
	status: string;
}

/**
 * Result of capturing a payment.
 */
export interface CaptureResult {
	captureId: string;
	status: string;
}

/**
 * Payment status information.
 */
export interface PaymentStatus {
	status: string;
	isPaid: boolean;
	isApproved: boolean;
	isFailed: boolean;
	captureId?: string;
}

// =============================================================================
// MERCHANT ONBOARDING
// =============================================================================

/**
 * Result of starting merchant onboarding.
 */
export interface OnboardingResult {
	onboardingUrl: string;
	trackingId: string;
}

/**
 * Merchant onboarding status.
 */
export interface OnboardingStatus {
	connected: boolean;
	merchantId: string | null;
	paymentsReceivable: boolean;
	primaryEmailConfirmed: boolean;
	onboardingStatus: "pending" | "in_review" | "completed" | "not_connected";
}

/**
 * Full payment account status from database.
 */
export interface PaymentAccountStatus {
	connected: boolean;
	merchantId: string | null;
	trackingId: string | null;
	onboardingStatus: string | null;
	canReceivePayments: boolean;
}
