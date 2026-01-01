import { z } from "zod";

// Input schemas for server functions
export const paymentStatusSchema = z.object({
	merchantId: z.number(),
});

export const setupPaymentAccountSchema = z.object({
	merchantId: z.number(),
});

export const createOnboardingLinkSchema = z.object({
	merchantId: z.number(),
});

export const refreshPaymentStatusSchema = z.object({
	merchantId: z.number(),
});

// Types
export type PaymentStatusInput = z.infer<typeof paymentStatusSchema>;
export type SetupPaymentAccountInput = z.infer<
	typeof setupPaymentAccountSchema
>;
export type CreateOnboardingLinkInput = z.infer<
	typeof createOnboardingLinkSchema
>;
export type RefreshPaymentStatusInput = z.infer<
	typeof refreshPaymentStatusSchema
>;

// Payment setup states for UI
export const paymentSetupStates = [
	"not_started",
	"account_created",
	"onboarding_pending",
	"onboarding_complete",
] as const;

export type PaymentSetupState = (typeof paymentSetupStates)[number];
