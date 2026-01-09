// Types (single source of truth)

// Client
export { getMollieClient, type MollieClient } from "./client";

// Config
export {
	getServerUrl,
	getWebhookUrl,
	isTestMode,
	MOLLIE_CONFIG,
} from "./config";
// Connect (OAuth + Client Links)
export {
	type CreateClientLinkInput,
	type CreateClientLinkOutput,
	createClientLink,
	// createMollieClientWithToken is for OAuth callback flow only (plain token before encryption)
	createMollieClientWithToken,
	type EnablePaymentMethodsResult,
	enableDefaultPaymentMethods,
	exchangeCodeForTokens,
	getMerchantMollieClient,
	getOnboardingStatus,
	type OAuthTokens,
	type OnboardingStatus,
	refreshAccessToken,
	storeMerchantTokens,
} from "./connect";
// Events
export {
	getEventById,
	getRetryCount,
	type IngestEventInput,
	type IngestEventOutput,
	incrementRetryCount,
	ingestMollieEvent,
	markEventFailed,
	markEventProcessed,
} from "./events";
// Handlers
export {
	dispatchMollieEvent,
	getRegisteredMollieEvents,
	type MollieEventType,
	type MollieHandler,
	registerMollieHandler,
} from "./handlers";
// Payments
export {
	type CreateOrderPaymentInput,
	type CreateOrderPaymentOutput,
	cancelPayment,
	createOrderPayment,
	getPayment,
} from "./payments";
// Processor
export { processMollieEvent } from "./processor";
// Subscriptions
export {
	type CreateFirstPaymentInput,
	type CreateSubscriptionInput,
	cancelSubscription,
	createFirstPaymentForMandate,
	createSubscription,
	getMandate,
	getMandates,
	getSubscription,
	hasValidMandate,
	revokeMandate,
} from "./subscriptions";
export type {
	Amount,
	MollieMandateStatus,
	MolliePaymentStatus,
	MollieResourceType,
	MollieSubscriptionStatus,
} from "./types";
// Utils
export {
	isSuccessfulPaymentStatus,
	isTerminalPaymentStatus,
	mapMolliePaymentStatus,
	type StatusMappingResult,
} from "./utils/status-mapper";
