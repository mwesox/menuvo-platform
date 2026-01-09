/**
 * Payment Services
 *
 * Unified interface for Stripe and Mollie payment operations.
 * This module provides the service layer functions that can be called
 * by the API routes to handle external payment provider interactions.
 *
 * Pattern:
 * 1. tRPC procedures handle database queries and return necessary info
 * 2. API routes call these service functions with the info from tRPC
 * 3. Service functions handle external API calls and return results
 */

// Re-export Mollie services
// Re-export Mollie subscriptions
// Re-export Mollie client
export {
	type CreateClientLinkInput,
	type CreateClientLinkOutput,
	type CreateFirstPaymentInput,
	type CreateSubscriptionInput,
	cancelSubscription as cancelMollieSubscription,
	// Client links / onboarding
	createClientLink,
	createFirstPaymentForMandate,
	createSubscription as createMollieSubscription,
	type EnablePaymentMethodsResult,
	// Payment methods
	enableDefaultPaymentMethods,
	// OAuth tokens
	exchangeCodeForTokens,
	getMandate,
	getMandates,
	// Client for merchant operations
	getMerchantMollieClient,
	getMollieClient,
	// Onboarding status
	getOnboardingStatus,
	getSubscription as getMollieSubscription,
	hasValidMandate,
	type MollieClient,
	type OAuthTokens,
	type OnboardingStatus,
	refreshAccessToken,
	revokeMandate,
	storeMerchantTokens,
} from "../mollie/index.js";
// Re-export Stripe services
// Re-export Stripe account status
// Re-export Stripe subscriptions
// Re-export Stripe client
export {
	type CreateAccountLinkInput,
	type CreateAccountLinkOutput,
	type CreateStripeAccountInput,
	type CreateStripeAccountOutput,
	cancelSubscription as cancelStripeSubscription,
	createAccountLink,
	createBillingPortalSession,
	// Account creation
	createStripeAccount,
	createSubscriptionCheckout,
	createTrialSubscription,
	deleteStripeAccount,
	getStripeClient,
	getSubscription as getStripeSubscription,
	mapCapabilityStatus,
	mapRequirementsStatus,
	type ParsedPaymentStatus,
	parseV2AccountStatus,
	resumeSubscription,
	type StripeClient,
} from "../stripe/index.js";

// ============================================================================
// HIGH-LEVEL SERVICE FUNCTIONS
// ============================================================================

// Mollie high-level services
export {
	cleanupMollieConnection,
	enableMolliePaymentMethods,
	getMollieDashboardUrl,
	type RefreshMollieStatusInput,
	type RefreshMollieStatusOutput,
	refreshMollieAccountStatus,
	type SetupMollieAccountInput,
	type SetupMollieAccountOutput,
	setupMollieConnectAccount,
} from "./mollie.service.js";
// Stripe high-level services
export {
	cleanupStripeAccount,
	createStripeOnboardingLink,
	type RefreshStripeStatusInput,
	type RefreshStripeStatusOutput,
	refreshStripeAccountStatus,
	type SetupStripeAccountInput,
	type SetupStripeAccountOutput,
	setupStripeConnectAccount,
} from "./stripe.service.js";
