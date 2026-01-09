import type {
	PaymentCapabilitiesStatus,
	PaymentRequirementsStatus,
} from "@menuvo/db/schema";
import type { Stripe } from "stripe";

/**
 * Parsed payment status from Stripe V2 Account API response.
 */
export type ParsedPaymentStatus = {
	requirementsStatus: PaymentRequirementsStatus;
	capabilitiesStatus: PaymentCapabilitiesStatus;
	onboardingComplete: boolean;
};

/**
 * Map Stripe V2 requirements status to our enum.
 *
 * Stripe V2 API types: 'currently_due' | 'eventually_due' | 'past_due'
 * When undefined = no requirements = onboarding complete
 *
 * DEFENSIVE: Unknown values default to "currently_due" (most restrictive)
 */
export function mapRequirementsStatus(
	stripeStatus:
		| Stripe.V2.Core.Account.Requirements.Summary.MinimumDeadline.Status
		| undefined,
): PaymentRequirementsStatus {
	if (stripeStatus === undefined) {
		// No minimum_deadline means no requirements due
		return "none";
	}
	switch (stripeStatus) {
		case "past_due":
			return "past_due";
		case "currently_due":
		case "eventually_due":
			return "currently_due";
		default:
			// DEFENSIVE: Unknown status = assume requirements are due
			return "currently_due";
	}
}

/**
 * Map Stripe V2 capability status to our enum.
 *
 * Stripe V2 API types: 'active' | 'pending' | 'restricted' | 'unsupported'
 *
 * DEFENSIVE: Unknown values default to "pending"
 */
export function mapCapabilityStatus(
	stripeStatus:
		| Stripe.V2.Core.Account.Configuration.Merchant.Capabilities.CardPayments.Status
		| undefined,
): PaymentCapabilitiesStatus {
	if (stripeStatus === undefined) {
		return "pending";
	}
	switch (stripeStatus) {
		case "active":
			return "active";
		case "pending":
			return "pending";
		case "restricted":
		case "unsupported":
			return "inactive";
		default:
			// DEFENSIVE: Unknown status = assume pending
			return "pending";
	}
}

/**
 * Parse payment status from Stripe V2 Account API response.
 *
 * Single source of truth for interpreting V2 account status.
 * Used by both refresh function and webhook handlers.
 *
 * @param account - Stripe V2 Account (must include requirements and configuration.merchant)
 */
export function parseV2AccountStatus(
	account: Stripe.V2.Core.Account,
): ParsedPaymentStatus {
	const stripeRequirementsStatus =
		account.requirements?.summary?.minimum_deadline?.status;
	const stripeCapabilityStatus =
		account.configuration?.merchant?.capabilities?.card_payments?.status;

	const requirementsStatus = mapRequirementsStatus(stripeRequirementsStatus);
	const capabilitiesStatus = mapCapabilityStatus(stripeCapabilityStatus);
	const onboardingComplete = requirementsStatus === "none";

	return {
		requirementsStatus,
		capabilitiesStatus,
		onboardingComplete,
	};
}
