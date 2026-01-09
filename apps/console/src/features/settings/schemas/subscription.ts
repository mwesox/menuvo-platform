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

// Note: Server function input schemas are now defined inline in the server functions
// since they use auth middleware to get merchantId from context.
// These schemas are kept for reference and potential client-side validation.

export const changePlanSchema = z.object({
	priceId: z.string().min(1, "Price ID is required"),
	newPlan: z.enum(planTiers),
});
export type ChangePlanInput = z.infer<typeof changePlanSchema>;

export const cancelSubscriptionSchema = z.object({
	immediately: z.boolean().default(false),
});
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
