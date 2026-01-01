// Client
export { getStripeClient, type StripeClient } from "./client";

// Connect
export {
	type CreateAccountLinkInput,
	type CreateAccountLinkOutput,
	type CreateStripeAccountInput,
	type CreateStripeAccountOutput,
	createAccountLink,
	createStripeAccount,
	deleteStripeAccount,
} from "./connect";

// Events
export {
	type IngestEventInput,
	type IngestEventOutput,
	ingestStripeEvent,
	markEventFailed,
	markEventProcessed,
} from "./events";
// Handlers
export {
	// Checkout handlers
	handleCheckoutSessionCompleted,
	handleCheckoutSessionExpired,
	// Subscription handlers
	handleSubscriptionCreated,
	handleSubscriptionDeleted,
	handleSubscriptionPaused,
	handleSubscriptionResumed,
	handleSubscriptionUpdated,
	handleTrialWillEnd,
	mapCapabilityStatus,
	mapRequirementsStatus,
	type UpdatePaymentStatusInput,
	updateMerchantPaymentStatus,
} from "./handlers";
// Subscriptions
export {
	cancelSubscription,
	createBillingPortalSession,
	createSubscriptionCheckout,
	createTrialSubscription,
	getSubscription,
	resumeSubscription,
} from "./subscriptions";
