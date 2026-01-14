/**
 * Payment Service Interface
 *
 * Defines the contract for payment operations.
 */

import type {
	CreatePaymentInput,
	MollieStatus,
	OnboardingResult,
	OnboardingStatus,
	PaymentResult,
	PaymentStatus,
} from "./types.js";

/**
 * Payment service interface.
 */
export interface IPaymentService {
	/** Create a payment for an order */
	createPayment(input: CreatePaymentInput): Promise<PaymentResult>;

	/** Get payment status by order ID */
	getPaymentStatus(orderId: string): Promise<PaymentStatus>;

	/** Start merchant Mollie onboarding */
	startOnboarding(merchantId: string): Promise<OnboardingResult>;

	/** Get merchant onboarding status */
	getOnboardingStatus(merchantId: string): Promise<OnboardingStatus>;

	/** Get Mollie dashboard URL for merchant */
	getDashboardUrl(merchantId: string): Promise<string | undefined>;

	/** Get full Mollie status from database */
	getMollieStatus(merchantId: string): Promise<MollieStatus>;
}
