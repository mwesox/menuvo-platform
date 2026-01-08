/**
 * Subscription Router
 *
 * Handles subscription management procedures:
 * - Get subscription details and status
 * - Change subscription plan (upgrade/downgrade)
 * - Cancel subscription
 * - Resume canceled subscription
 * - Create Stripe billing portal session
 *
 * Architecture:
 * - Database operations are handled directly in procedures
 * - External API calls (Stripe) require service functions
 *   that should be implemented in the API layer
 */

import { merchants } from "@menuvo/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type {
	BillingPortalResponse,
	CancelSubscriptionResponse,
	ChangePlanResponse,
	ResumeSubscriptionResponse,
	SubscriptionDetails,
} from "../schemas/subscription.schema.js";
import {
	cancelSubscriptionSchema,
	changePlanSchema,
	createBillingPortalSchema,
} from "../schemas/subscription.schema.js";
import { protectedProcedure, router } from "../trpc.js";

/**
 * Map Stripe price IDs to plan tiers
 * This should be configured based on your Stripe product setup
 */
function getPlanTierFromPriceId(
	priceId: string | null,
): "starter" | "professional" | "max" | null {
	if (!priceId) return null;

	// TODO: Replace with actual Stripe price IDs from environment
	// These mappings should match your Stripe product configuration
	const priceToTierMap: Record<string, "starter" | "professional" | "max"> = {
		// Example mappings - replace with actual price IDs
		price_starter_monthly: "starter",
		price_starter_yearly: "starter",
		price_professional_monthly: "professional",
		price_professional_yearly: "professional",
		price_max_monthly: "max",
		price_max_yearly: "max",
	};

	return priceToTierMap[priceId] ?? null;
}

export const subscriptionRouter = router({
	/**
	 * Get current subscription details
	 * Returns the merchant's subscription plan, status, and billing information
	 */
	getDetails: protectedProcedure.query(
		async ({ ctx }): Promise<SubscriptionDetails> => {
			const merchantId = ctx.session.merchantId;

			const merchant = await ctx.db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					subscriptionStatus: true,
					subscriptionId: true,
					subscriptionPriceId: true,
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

			// Derive plan tier from price ID
			const plan = getPlanTierFromPriceId(merchant.subscriptionPriceId);

			// Determine if subscription will cancel at period end
			// This would typically come from Stripe's subscription.cancel_at_period_end
			// For now, we infer it from the status
			const cancelAtPeriodEnd = merchant.subscriptionStatus === "canceled";

			return {
				plan,
				status: merchant.subscriptionStatus,
				subscriptionId: merchant.subscriptionId,
				priceId: merchant.subscriptionPriceId,
				currentPeriodEnd: merchant.subscriptionCurrentPeriodEnd,
				trialEndsAt: merchant.subscriptionTrialEndsAt,
				cancelAtPeriodEnd,
			};
		},
	),

	/**
	 * Change subscription plan
	 * Upgrades or downgrades the merchant's subscription tier
	 *
	 * Note: This procedure validates the request and returns info
	 * for the API layer to execute the plan change via Stripe API.
	 */
	changePlan: protectedProcedure
		.input(changePlanSchema)
		.mutation(async ({ ctx, input }): Promise<ChangePlanResponse> => {
			const merchantId = ctx.session.merchantId;

			const merchant = await ctx.db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					id: true,
					subscriptionId: true,
					subscriptionPriceId: true,
					subscriptionStatus: true,
					paymentAccountId: true,
				},
			});

			if (!merchant) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Merchant not found",
				});
			}

			// Verify merchant has an active subscription
			if (
				!merchant.subscriptionId ||
				!["active", "trialing"].includes(merchant.subscriptionStatus)
			) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message:
						"No active subscription found. Please subscribe to a plan first.",
				});
			}

			// Prevent changing to the same plan
			if (merchant.subscriptionPriceId === input.priceId) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "You are already on this plan",
				});
			}

			// Return info for API layer to execute the plan change
			return {
				merchantId: merchant.id,
				subscriptionId: merchant.subscriptionId,
				currentPriceId: merchant.subscriptionPriceId,
				newPriceId: input.priceId,
				newPlan: input.newPlan,
				stripeAccountId: merchant.paymentAccountId,
			};
		}),

	/**
	 * Cancel subscription
	 * Cancels the merchant's subscription immediately or at period end
	 *
	 * Note: This procedure validates the request and returns info
	 * for the API layer to execute the cancellation via Stripe API.
	 */
	cancel: protectedProcedure
		.input(cancelSubscriptionSchema)
		.mutation(async ({ ctx, input }): Promise<CancelSubscriptionResponse> => {
			const merchantId = ctx.session.merchantId;

			const merchant = await ctx.db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					id: true,
					subscriptionId: true,
					subscriptionStatus: true,
					paymentAccountId: true,
				},
			});

			if (!merchant) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Merchant not found",
				});
			}

			// Verify merchant has an active subscription
			if (!merchant.subscriptionId) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "No subscription found",
				});
			}

			// Verify subscription is in a cancellable state
			if (
				!["active", "trialing", "past_due"].includes(
					merchant.subscriptionStatus,
				)
			) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: `Cannot cancel subscription with status: ${merchant.subscriptionStatus}`,
				});
			}

			// Return info for API layer to execute the cancellation
			return {
				merchantId: merchant.id,
				subscriptionId: merchant.subscriptionId,
				immediately: input.immediately,
				stripeAccountId: merchant.paymentAccountId,
			};
		}),

	/**
	 * Resume canceled subscription
	 * Reactivates a subscription that was set to cancel at period end
	 *
	 * Note: This procedure validates the request and returns info
	 * for the API layer to resume the subscription via Stripe API.
	 */
	resume: protectedProcedure.mutation(
		async ({ ctx }): Promise<ResumeSubscriptionResponse> => {
			const merchantId = ctx.session.merchantId;

			const merchant = await ctx.db.query.merchants.findFirst({
				where: eq(merchants.id, merchantId),
				columns: {
					id: true,
					subscriptionId: true,
					subscriptionStatus: true,
					paymentAccountId: true,
				},
			});

			if (!merchant) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Merchant not found",
				});
			}

			// Verify merchant has a subscription
			if (!merchant.subscriptionId) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "No subscription found",
				});
			}

			// Only allow resuming subscriptions that are active (but set to cancel)
			// The actual cancel_at_period_end check should be done in the API layer
			// by fetching the subscription from Stripe
			if (merchant.subscriptionStatus === "canceled") {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message:
						"Subscription has already been canceled. Please create a new subscription.",
				});
			}

			if (merchant.subscriptionStatus === "none") {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "No active subscription to resume",
				});
			}

			// Return info for API layer to resume the subscription
			return {
				merchantId: merchant.id,
				subscriptionId: merchant.subscriptionId,
				stripeAccountId: merchant.paymentAccountId,
			};
		},
	),

	/**
	 * Create Stripe billing portal session
	 * Generates a link to Stripe's customer billing portal
	 *
	 * Note: This procedure validates the request and returns info
	 * for the API layer to create the portal session via Stripe API.
	 */
	createBillingPortal: protectedProcedure
		.input(createBillingPortalSchema)
		.mutation(
			async ({
				ctx,
				input,
			}): Promise<
				| BillingPortalResponse
				| {
						merchantId: string;
						returnUrl: string;
						stripeAccountId: string | null;
				  }
			> => {
				const merchantId = ctx.session.merchantId;

				const merchant = await ctx.db.query.merchants.findFirst({
					where: eq(merchants.id, merchantId),
					columns: {
						id: true,
						paymentAccountId: true,
						subscriptionId: true,
					},
				});

				if (!merchant) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Merchant not found",
					});
				}

				// Stripe Connect account is required for billing portal
				if (!merchant.paymentAccountId) {
					throw new TRPCError({
						code: "PRECONDITION_FAILED",
						message:
							"Payment account not set up. Please complete onboarding first.",
					});
				}

				// Return info for API layer to create the billing portal session
				// The API layer should use stripe.billingPortal.sessions.create()
				return {
					merchantId: merchant.id,
					returnUrl: input.returnUrl,
					stripeAccountId: merchant.paymentAccountId,
				};
			},
		),
});
