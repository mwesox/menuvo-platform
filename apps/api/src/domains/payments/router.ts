/**
 * Payment Router
 *
 * Thin wrappers around the PaymentService for payment-related procedures:
 * - Mollie payment setup and management
 * - Payment status queries
 *
 * Architecture:
 * - Service handles all DB operations internally
 * - tRPC procedures are lean wrappers that just call service methods
 * - Access services via ctx.services.payments
 */

import { protectedProcedure, router } from "../../trpc/trpc.js";
import type { MollieStatus } from "./types.js";

export const paymentRouter = router({
	// ============================================================================
	// PAYMENT STATUS
	// ============================================================================

	/**
	 * Get Mollie account status for current merchant
	 * Returns the current onboarding and payment status from the database
	 */
	getMollieStatus: protectedProcedure.query(
		async ({ ctx }): Promise<MollieStatus> => {
			return ctx.services.payments.getMollieStatus(ctx.session.merchantId);
		},
	),

	// ============================================================================
	// MERCHANT ONBOARDING
	// ============================================================================

	/**
	 * Start Mollie onboarding for current merchant
	 * Creates a client link and returns the onboarding URL
	 */
	startOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
		return ctx.services.payments.startOnboarding(ctx.session.merchantId);
	}),

	/**
	 * Get onboarding status from Mollie API
	 * Returns fresh status and updates DB
	 */
	getOnboardingStatus: protectedProcedure.query(async ({ ctx }) => {
		return ctx.services.payments.getOnboardingStatus(ctx.session.merchantId);
	}),

	/**
	 * Get Mollie dashboard URL for current merchant
	 */
	getDashboardUrl: protectedProcedure.query(async ({ ctx }) => {
		const dashboardUrl = await ctx.services.payments.getDashboardUrl(
			ctx.session.merchantId,
		);
		return { dashboardUrl };
	}),
});
