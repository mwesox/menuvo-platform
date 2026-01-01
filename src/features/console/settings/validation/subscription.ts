import { z } from "zod";

// ============================================================================
// SUBSCRIPTION SCHEMAS
// ============================================================================

export const planTiers = ["starter", "professional", "max"] as const;
export type PlanTier = (typeof planTiers)[number];

export const subscriptionStatuses = [
	"none",
	"trialing",
	"active",
	"paused",
	"past_due",
	"canceled",
] as const;
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export const changePlanSchema = z.object({
	merchantId: z.number(),
	priceId: z.string().min(1, "Price ID is required"),
	newPlan: z.enum(planTiers),
});
export type ChangePlanInput = z.infer<typeof changePlanSchema>;

export const cancelSubscriptionSchema = z.object({
	merchantId: z.number(),
	immediately: z.boolean().default(false),
});
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;

export const resumeSubscriptionSchema = z.object({
	merchantId: z.number(),
});
export type ResumeSubscriptionInput = z.infer<typeof resumeSubscriptionSchema>;

export const billingPortalSchema = z.object({
	merchantId: z.number(),
});
export type BillingPortalInput = z.infer<typeof billingPortalSchema>;
