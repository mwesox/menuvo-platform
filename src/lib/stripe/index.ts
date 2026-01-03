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
	getEventById,
	getRetryCount,
	type IngestEventInput,
	type IngestEventOutput,
	incrementRetryCount,
	ingestStripeEvent,
	markEventFailed,
	markEventProcessed,
} from "./events";

// Handlers
export {
	// Registry (for debugging/testing)
	getRegisteredV1Events,
	getRegisteredV2Events,
	type UpdatePaymentStatusInput,
	updateMerchantPaymentStatus,
} from "./handlers";

// Processor
export { processStripeEvent } from "./processor";

// Schemas (event types)
export {
	EventType,
	isHandledEvent,
	// Type guards
	isV1Event,
	isV2Event,
	type ThinEventPayload,
	// Thin event payload schema
	ThinEventPayloadSchema,
	// Event type enums
	V1EventType,
	V2EventType,
} from "./schemas";

// Subscriptions
export {
	cancelSubscription,
	createBillingPortalSession,
	createSubscriptionCheckout,
	createTrialSubscription,
	getSubscription,
	resumeSubscription,
} from "./subscriptions";

// V2 Account parsing utilities
export {
	mapCapabilityStatus,
	mapRequirementsStatus,
	type ParsedPaymentStatus,
	parseV2AccountStatus,
} from "./v2-account";
