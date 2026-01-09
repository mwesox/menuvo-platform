/**
 * Payment Schemas
 *
 * Zod schemas for payment-related procedures including:
 * - Stripe Connect onboarding
 * - Mollie Connect onboarding
 * - Payment status queries
 */

import { z } from "zod";

// ============================================================================
// Common Payment Schemas
// ============================================================================

/**
 * Generic payment status response
 */
export const paymentStatusSchema = z.object({
	connected: z.boolean(),
	accountId: z.string().optional(),
	chargesEnabled: z.boolean().optional(),
	payoutsEnabled: z.boolean().optional(),
});

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

// ============================================================================
// Stripe Schemas
// ============================================================================

/**
 * Stripe onboarding link request
 */
export const stripeOnboardingSchema = z.object({
	returnUrl: z.string().url(),
	refreshUrl: z.string().url(),
});

export type StripeOnboardingInput = z.infer<typeof stripeOnboardingSchema>;

/**
 * Stripe account link response
 */
export const stripeAccountLinkResponseSchema = z.object({
	url: z.string().url(),
	expiresAt: z.number(),
});

export type StripeAccountLinkResponse = z.infer<
	typeof stripeAccountLinkResponseSchema
>;

/**
 * Stripe status response - reflects database state
 */
export const stripeStatusSchema = z.object({
	connected: z.boolean(),
	accountId: z.string().nullable(),
	onboardingComplete: z.boolean(),
	capabilitiesStatus: z
		.enum(["active", "pending", "inactive"])
		.nullable()
		.optional(),
	requirementsStatus: z
		.enum(["none", "currently_due", "past_due", "pending_verification"])
		.nullable()
		.optional(),
	// Subscription fields
	subscriptionStatus: z
		.enum(["none", "trialing", "active", "paused", "past_due", "canceled"])
		.optional(),
	subscriptionId: z.string().nullable().optional(),
	subscriptionTrialEndsAt: z.date().nullable().optional(),
	subscriptionCurrentPeriodEnd: z.date().nullable().optional(),
});

export type StripeStatus = z.infer<typeof stripeStatusSchema>;

// ============================================================================
// Mollie Schemas
// ============================================================================

/**
 * Mollie client link (onboarding) request
 */
export const mollieOnboardingSchema = z.object({
	// OAuth state parameter for CSRF protection (optional, generated server-side if not provided)
	state: z.string().optional(),
});

export type MollieOnboardingInput = z.infer<typeof mollieOnboardingSchema>;

/**
 * Mollie onboarding link response
 */
export const mollieOnboardingResponseSchema = z.object({
	clientLinkId: z.string(),
	onboardingUrl: z.string().url(),
});

export type MollieOnboardingResponse = z.infer<
	typeof mollieOnboardingResponseSchema
>;

/**
 * Mollie status response - reflects database state
 */
export const mollieStatusSchema = z.object({
	connected: z.boolean(),
	organizationId: z.string().nullable(),
	profileId: z.string().nullable(),
	onboardingStatus: z
		.enum(["needs-data", "in-review", "completed"])
		.nullable()
		.optional(),
	canReceivePayments: z.boolean(),
	canReceiveSettlements: z.boolean(),
	// Mandate & subscription fields
	mandateId: z.string().nullable().optional(),
	mandateStatus: z.enum(["pending", "valid", "invalid"]).nullable().optional(),
	subscriptionId: z.string().nullable().optional(),
	subscriptionStatus: z
		.enum(["pending", "active", "canceled", "suspended", "completed"])
		.nullable()
		.optional(),
	dashboardUrl: z.string().url().optional(),
});

export type MollieStatus = z.infer<typeof mollieStatusSchema>;

/**
 * Mollie dashboard URL response
 */
export const mollieDashboardUrlSchema = z.object({
	url: z.string().url(),
});

export type MollieDashboardUrl = z.infer<typeof mollieDashboardUrlSchema>;
