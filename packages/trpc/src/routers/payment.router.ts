/**
 * Payment Router
 *
 * Handles payment-related procedures:
 * - Stripe payment setup and management
 * - Mollie payment setup and management
 * - Payment status queries
 *
 * Architecture:
 * - Database operations are handled directly in procedures
 * - External API calls (Stripe/Mollie) require service functions
 *   that should be implemented in the API layer
 */

import { merchants } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { MollieStatus, StripeStatus } from "../schemas/payment.schema.js";
import {
	mollieOnboardingSchema,
	stripeOnboardingSchema,
} from "../schemas/payment.schema.js";
import { protectedProcedure, router } from "../trpc.js";

export const paymentRouter = router({
	// ============================================================================
	// STRIPE PROCEDURES
	// ============================================================================

	/**
	 * Get Stripe account status for current merchant
	 * Returns the current onboarding and capabilities status from the database
	 */
	getStripeStatus: protectedProcedure.query(
		async ({ ctx }): Promise<StripeStatus> => {
			const merchantId = ctx.session.merchantId;

			const merchant = await ctx.db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					id: true,
					paymentAccountId: true,
					paymentOnboardingComplete: true,
					paymentCapabilitiesStatus: true,
					paymentRequirementsStatus: true,
					subscriptionStatus: true,
					subscriptionId: true,
					subscriptionTrialEndsAt: true,
					subscriptionCurrentPeriodEnd: true,
				},
			});

			if (!merchant) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Merchant not found",
				});
			}

			return {
				connected: !!merchant.paymentAccountId,
				accountId: merchant.paymentAccountId,
				onboardingComplete: merchant.paymentOnboardingComplete,
				capabilitiesStatus: merchant.paymentCapabilitiesStatus,
				requirementsStatus: merchant.paymentRequirementsStatus,
				subscriptionStatus: merchant.subscriptionStatus,
				subscriptionId: merchant.subscriptionId,
				subscriptionTrialEndsAt: merchant.subscriptionTrialEndsAt,
				subscriptionCurrentPeriodEnd: merchant.subscriptionCurrentPeriodEnd,
			};
		},
	),

	/**
	 * Setup Stripe account for current merchant
	 * Creates a new Stripe Connect account if one doesn't exist
	 *
	 * Note: This procedure creates the database record and returns info needed
	 * for onboarding. The actual Stripe API call should be made by the API layer
	 * and the result passed back to update the merchant record.
	 *
	 * Implementation pattern:
	 * 1. API layer calls Stripe to create Connect account
	 * 2. API layer calls this procedure to store the account ID
	 * 3. API layer creates account link and returns URL to client
	 */
	setupStripeAccount: protectedProcedure
		.input(stripeOnboardingSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = ctx.session.merchantId;

			const merchant = await ctx.db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					id: true,
					name: true,
					email: true,
					paymentAccountId: true,
				},
			});

			if (!merchant) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Merchant not found",
				});
			}

			// If account already exists, return info for creating onboarding link
			if (merchant.paymentAccountId) {
				return {
					accountId: merchant.paymentAccountId,
					alreadyExists: true,
					merchantName: merchant.name,
					merchantEmail: merchant.email,
					returnUrl: input.returnUrl,
					refreshUrl: input.refreshUrl,
				};
			}

			// Return merchant info for API layer to create Stripe account
			return {
				accountId: null,
				alreadyExists: false,
				merchantName: merchant.name,
				merchantEmail: merchant.email,
				returnUrl: input.returnUrl,
				refreshUrl: input.refreshUrl,
			};
		}),

	/**
	 * Create Stripe onboarding link for current merchant
	 * Returns info needed to create an Account Link in Stripe
	 *
	 * Note: The actual link creation should be done by the API layer
	 * using the Stripe SDK, as it requires the API key.
	 */
	createStripeOnboardingLink: protectedProcedure
		.input(stripeOnboardingSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = ctx.session.merchantId;

			const merchant = await ctx.db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					id: true,
					paymentAccountId: true,
				},
			});

			if (!merchant) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Merchant not found",
				});
			}

			if (!merchant.paymentAccountId) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "Stripe account not set up. Call setupStripeAccount first.",
				});
			}

			// Return info for API layer to create the account link
			return {
				accountId: merchant.paymentAccountId,
				returnUrl: input.returnUrl,
				refreshUrl: input.refreshUrl,
			};
		}),

	/**
	 * Refresh Stripe account status from Stripe API
	 * Updates the local database with the latest status from Stripe
	 *
	 * Note: This is a database-only operation. The API layer should:
	 * 1. Fetch the account status from Stripe API
	 * 2. Call this procedure with the updated status
	 */
	refreshStripeStatus: protectedProcedure.mutation(async ({ ctx }) => {
		const merchantId = ctx.session.merchantId;

		const merchant = await ctx.db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				id: true,
				paymentAccountId: true,
			},
		});

		if (!merchant) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Merchant not found",
			});
		}

		if (!merchant.paymentAccountId) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Stripe account not set up",
			});
		}

		// Return the account ID for the API layer to fetch fresh status
		return {
			accountId: merchant.paymentAccountId,
			merchantId: merchant.id,
		};
	}),

	// ============================================================================
	// MOLLIE PROCEDURES
	// ============================================================================

	/**
	 * Get Mollie account status for current merchant
	 * Returns the current onboarding and payment status from the database
	 */
	getMollieStatus: protectedProcedure.query(
		async ({ ctx }): Promise<MollieStatus> => {
			const merchantId = ctx.session.merchantId;

			const merchant = await ctx.db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					id: true,
					mollieOrganizationId: true,
					mollieProfileId: true,
					mollieOnboardingStatus: true,
					mollieCanReceivePayments: true,
					mollieCanReceiveSettlements: true,
					mollieMandateId: true,
					mollieMandateStatus: true,
					mollieSubscriptionId: true,
					mollieSubscriptionStatus: true,
				},
			});

			if (!merchant) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Merchant not found",
				});
			}

			return {
				connected: !!merchant.mollieOrganizationId,
				organizationId: merchant.mollieOrganizationId,
				profileId: merchant.mollieProfileId,
				onboardingStatus: merchant.mollieOnboardingStatus,
				canReceivePayments: merchant.mollieCanReceivePayments ?? false,
				canReceiveSettlements: merchant.mollieCanReceiveSettlements ?? false,
				mandateId: merchant.mollieMandateId,
				mandateStatus: merchant.mollieMandateStatus,
				subscriptionId: merchant.mollieSubscriptionId,
				subscriptionStatus: merchant.mollieSubscriptionStatus,
			};
		},
	),

	/**
	 * Setup Mollie account for current merchant
	 * Creates a client link for co-branded merchant onboarding
	 *
	 * Note: This procedure returns info needed for the API layer
	 * to create the client link via Mollie's Client Links API.
	 */
	setupMollieAccount: protectedProcedure
		.input(mollieOnboardingSchema)
		.mutation(async ({ ctx, input }) => {
			const merchantId = ctx.session.merchantId;

			const merchant = await ctx.db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					id: true,
					name: true,
					email: true,
					mollieOrganizationId: true,
				},
			});

			if (!merchant) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Merchant not found",
				});
			}

			// If already connected to Mollie, return existing info
			if (merchant.mollieOrganizationId) {
				return {
					organizationId: merchant.mollieOrganizationId,
					alreadyExists: true,
					merchantName: merchant.name,
					merchantEmail: merchant.email,
					state: input.state,
				};
			}

			// Return merchant info for API layer to create client link
			return {
				organizationId: null,
				alreadyExists: false,
				merchantName: merchant.name,
				merchantEmail: merchant.email,
				state: input.state,
			};
		}),

	/**
	 * Refresh Mollie account status from Mollie API
	 * Updates the local database with the latest status from Mollie
	 *
	 * Note: This returns info for the API layer to fetch status.
	 * The API layer should use the merchant's OAuth token to call
	 * Mollie's onboarding API.
	 */
	refreshMollieStatus: protectedProcedure.mutation(async ({ ctx }) => {
		const merchantId = ctx.session.merchantId;

		const merchant = await ctx.db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				id: true,
				mollieOrganizationId: true,
				mollieAccessToken: true,
			},
		});

		if (!merchant) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Merchant not found",
			});
		}

		if (!merchant.mollieOrganizationId) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Mollie account not set up",
			});
		}

		if (!merchant.mollieAccessToken) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Mollie OAuth tokens not configured",
			});
		}

		// Return info for the API layer to fetch fresh status
		return {
			merchantId: merchant.id,
			organizationId: merchant.mollieOrganizationId,
			hasTokens: true,
		};
	}),

	/**
	 * Get Mollie dashboard URL for current merchant
	 * Returns the dashboard link from the onboarding API
	 *
	 * Note: The actual URL comes from Mollie's onboarding API response.
	 * This procedure returns info for the API layer to fetch it.
	 */
	getMollieDashboardUrl: protectedProcedure.query(async ({ ctx }) => {
		const merchantId = ctx.session.merchantId;

		const merchant = await ctx.db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				id: true,
				mollieOrganizationId: true,
				mollieAccessToken: true,
			},
		});

		if (!merchant) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Merchant not found",
			});
		}

		if (!merchant.mollieOrganizationId) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Mollie account not set up",
			});
		}

		if (!merchant.mollieAccessToken) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Mollie OAuth tokens not configured",
			});
		}

		// Return info for the API layer to fetch the dashboard URL
		// The API layer should call getOnboardingStatus() from mollie service
		return {
			merchantId: merchant.id,
			organizationId: merchant.mollieOrganizationId,
			hasTokens: true,
		};
	}),

	// ============================================================================
	// LEGACY PROCEDURES (for backward compatibility)
	// ============================================================================

	/**
	 * Get payment account status for current merchant
	 * @deprecated Use getStripeStatus or getMollieStatus instead
	 */
	getStatus: protectedProcedure.query(async ({ ctx }) => {
		const merchantId = ctx.session.merchantId;

		const merchant = await ctx.db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				id: true,
				name: true,
				email: true,
				paymentAccountId: true,
				paymentOnboardingComplete: true,
				paymentCapabilitiesStatus: true,
				paymentRequirementsStatus: true,
				subscriptionStatus: true,
				subscriptionId: true,
				subscriptionTrialEndsAt: true,
				subscriptionCurrentPeriodEnd: true,
			},
		});

		if (!merchant) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Merchant not found",
			});
		}

		return merchant;
	}),
});
