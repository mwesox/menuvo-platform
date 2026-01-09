/**
 * Merchant Capabilities
 *
 * Type definitions for merchant payment and feature capabilities
 * Used by checkout and store features to determine available functionality.
 */

export interface MerchantCapabilities {
	/** Whether the merchant can accept payments */
	canAcceptPayments: boolean;

	/** Whether the merchant has Stripe enabled */
	hasStripe: boolean;

	/** Whether the merchant has Mollie enabled */
	hasMollie: boolean;

	/** Available payment methods */
	paymentMethods: string[];

	/** Whether orders can be placed */
	canPlaceOrders: boolean;

	/** Whether the store is currently open */
	isOpen: boolean;
}

/**
 * Default capabilities for a store without payment setup
 */
export const defaultCapabilities: MerchantCapabilities = {
	canAcceptPayments: false,
	hasStripe: false,
	hasMollie: false,
	paymentMethods: [],
	canPlaceOrders: false,
	isOpen: false,
};
