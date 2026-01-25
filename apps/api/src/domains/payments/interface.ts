/**
 * Payment Service Interface
 *
 * Defines the contract for payment operations.
 */

import type {
	CaptureResult,
	CreatePaymentInput,
	OnboardingResult,
	OnboardingStatus,
	PaymentAccountStatus,
	PaymentResult,
	PaymentStatus,
} from "./types.js";

/**
 * Payment service interface.
 */
export interface IPaymentService {
	/** Create a payment for an order */
	createPayment(input: CreatePaymentInput): Promise<PaymentResult>;

	/** Capture a payment after customer approval */
	capturePayment(orderId: string): Promise<CaptureResult>;

	/** Get payment status by order ID */
	getPaymentStatus(orderId: string): Promise<PaymentStatus>;

	/** Start merchant payment onboarding */
	startOnboarding(merchantId: string): Promise<OnboardingResult>;

	/** Get merchant onboarding status from payment provider */
	getOnboardingStatus(merchantId: string): Promise<OnboardingStatus>;

	/** Get full payment account status from database */
	getAccountStatus(merchantId: string): Promise<PaymentAccountStatus>;
}
