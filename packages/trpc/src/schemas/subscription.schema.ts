/**
 * Subscription Schemas
 *
 * Zod schemas for subscription-related procedures including:
 * - Subscription details and status
 * - Plan tier management
 * - Billing portal access
 */

import { z } from "zod";

// ============================================================================
// Plan Tier Enum
// ============================================================================

/**
 * Available subscription plan tiers
 * - starter: Basic plan for small businesses
 * - professional: Mid-tier plan with more features
 * - max: Full-featured plan for larger operations
 */
export const planTierEnum = z.enum(["starter", "professional", "max"]);

export type PlanTier = z.infer<typeof planTierEnum>;

// ============================================================================
// Subscription Status Enum
// ============================================================================

/**
 * Subscription status values (matches database enum)
 */
export const subscriptionStatusEnum = z.enum([
	"none",
	"trialing",
	"active",
	"paused",
	"past_due",
	"canceled",
]);

export type SubscriptionStatusType = z.infer<typeof subscriptionStatusEnum>;

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Change plan input schema
 * Used when upgrading or downgrading subscription plans
 */
export const changePlanSchema = z.object({
	/** Stripe price ID for the new plan */
	priceId: z.string().min(1, "Price ID is required"),
	/** The new plan tier to switch to */
	newPlan: planTierEnum,
});

export type ChangePlanInput = z.infer<typeof changePlanSchema>;

/**
 * Cancel subscription input schema
 */
export const cancelSubscriptionSchema = z.object({
	/** If true, cancels immediately. If false, cancels at period end */
	immediately: z.boolean().default(false),
});

export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;

/**
 * Create billing portal input schema
 */
export const createBillingPortalSchema = z.object({
	/** URL to redirect to after portal session */
	returnUrl: z.string().url("Return URL must be a valid URL"),
});

export type CreateBillingPortalInput = z.infer<
	typeof createBillingPortalSchema
>;

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Subscription details response schema
 * Returned by getDetails procedure
 */
export const subscriptionDetailsSchema = z.object({
	/** Current plan tier (derived from price ID) */
	plan: planTierEnum.nullable(),
	/** Current subscription status */
	status: subscriptionStatusEnum,
	/** Stripe subscription ID */
	subscriptionId: z.string().nullable(),
	/** Stripe price ID */
	priceId: z.string().nullable(),
	/** When the current billing period ends */
	currentPeriodEnd: z.date().nullable(),
	/** When the trial period ends (if trialing) */
	trialEndsAt: z.date().nullable(),
	/** Whether subscription will cancel at period end */
	cancelAtPeriodEnd: z.boolean(),
});

export type SubscriptionDetails = z.infer<typeof subscriptionDetailsSchema>;

/**
 * Billing portal response schema
 */
export const billingPortalResponseSchema = z.object({
	/** Stripe billing portal URL */
	url: z.string().url(),
});

export type BillingPortalResponse = z.infer<typeof billingPortalResponseSchema>;

/**
 * Change plan response schema
 * Returns info needed by API layer to execute the plan change
 */
export const changePlanResponseSchema = z.object({
	/** Merchant ID */
	merchantId: z.string(),
	/** Current Stripe subscription ID */
	subscriptionId: z.string().nullable(),
	/** Current price ID */
	currentPriceId: z.string().nullable(),
	/** New price ID requested */
	newPriceId: z.string(),
	/** New plan tier requested */
	newPlan: planTierEnum,
	/** Stripe Connect account ID (if applicable) */
	stripeAccountId: z.string().nullable(),
});

export type ChangePlanResponse = z.infer<typeof changePlanResponseSchema>;

/**
 * Cancel subscription response schema
 * Returns info needed by API layer to execute the cancellation
 */
export const cancelSubscriptionResponseSchema = z.object({
	/** Merchant ID */
	merchantId: z.string(),
	/** Stripe subscription ID to cancel */
	subscriptionId: z.string(),
	/** Whether to cancel immediately or at period end */
	immediately: z.boolean(),
	/** Stripe Connect account ID (if applicable) */
	stripeAccountId: z.string().nullable(),
});

export type CancelSubscriptionResponse = z.infer<
	typeof cancelSubscriptionResponseSchema
>;

/**
 * Resume subscription response schema
 * Returns info needed by API layer to resume the subscription
 */
export const resumeSubscriptionResponseSchema = z.object({
	/** Merchant ID */
	merchantId: z.string(),
	/** Stripe subscription ID to resume */
	subscriptionId: z.string(),
	/** Stripe Connect account ID (if applicable) */
	stripeAccountId: z.string().nullable(),
});

export type ResumeSubscriptionResponse = z.infer<
	typeof resumeSubscriptionResponseSchema
>;
