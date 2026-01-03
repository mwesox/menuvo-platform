/**
 * Merchant-level capabilities.
 * Derived from merchant settings, inherited by all stores.
 */
export type MerchantCapabilities = {
	canAcceptOnlinePayment: boolean;
};

/**
 * Store-level capabilities.
 * Combines store settings with inherited merchant capabilities.
 */
export type StoreCapabilities = {
	/** Inherited from merchant - can process online payments */
	canAcceptOnlinePayment: boolean;
};
