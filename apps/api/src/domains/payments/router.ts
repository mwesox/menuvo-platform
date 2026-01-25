/**
 * Payment Router
 *
 * Thin wrappers around the PaymentService for payment-related procedures:
 * - PayPal payment setup and management
 * - Payment status queries
 *
 * Architecture:
 * - Service handles all DB operations internally
 * - tRPC procedures are lean wrappers that just call service methods
 * - Access services via ctx.services.payments
 */

import { protectedProcedure, router } from "../../trpc/trpc.js";
import type { PaymentAccountStatus } from "./types.js";

export const paymentRouter = router({
	// ============================================================================
	// PAYMENT STATUS
	// ============================================================================

	/**
	 * Get PayPal account status for current merchant
	 * Returns the current onboarding and payment status from the database
	 */
	getAccountStatus: protectedProcedure.query(
		async ({ ctx }): Promise<PaymentAccountStatus> => {
			return ctx.services.payments.getAccountStatus(ctx.session.merchantId);
		},
	),

	// ============================================================================
	// MERCHANT ONBOARDING
	// ============================================================================

	/**
	 * Start PayPal onboarding for current merchant
	 * Creates a partner referral and returns the onboarding URL
	 */
	startOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
		return ctx.services.payments.startOnboarding(ctx.session.merchantId);
	}),

	/**
	 * Get onboarding status from PayPal API
	 * Returns fresh status and updates DB
	 */
	getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
		return ctx.services.payments.getOnboardingStatus(ctx.session.merchantId);
	}),
});
