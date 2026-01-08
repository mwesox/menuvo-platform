/**
 * Shared Mollie types.
 * Single source of truth for types used across the Mollie integration.
 */

/**
 * Mollie Amount type.
 * Matches the Mollie API Amount interface.
 */
export type Amount = {
	currency: string;
	value: string;
};

/**
 * Resource types that Mollie can send webhooks for.
 */
export type MollieResourceType =
	| "payment"
	| "subscription"
	| "refund"
	| "mandate";

/**
 * Mollie payment status values.
 */
export type MolliePaymentStatus =
	| "open"
	| "pending"
	| "authorized"
	| "paid"
	| "expired"
	| "failed"
	| "canceled";

/**
 * Mollie subscription status values.
 */
export type MollieSubscriptionStatus =
	| "pending"
	| "active"
	| "canceled"
	| "suspended"
	| "completed";

/**
 * Mollie mandate status values.
 */
export type MollieMandateStatus = "valid" | "pending" | "invalid";
