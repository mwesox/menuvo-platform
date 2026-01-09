// Note: Payment server functions now use auth middleware to get merchantId from context.
// Input schemas are no longer needed since these functions don't accept additional input.

// Payment setup states for UI
export const paymentSetupStates = [
	"not_started",
	"account_created",
	"onboarding_pending",
	"onboarding_complete",
] as const;

export type PaymentSetupState = (typeof paymentSetupStates)[number];
