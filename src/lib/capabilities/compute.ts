import { env } from "@/env";
import type { MerchantCapabilities, StoreCapabilities } from "./types";

/**
 * Minimal merchant data needed to compute capabilities.
 */
type MerchantData = {
	mollieCanReceivePayments: boolean | null;
};

/**
 * Compute merchant capabilities from merchant data.
 *
 * @example
 * const caps = computeMerchantCapabilities(merchant);
 * if (!caps.canAcceptOnlinePayment) {
 *   throw new Error("Merchant cannot accept online payments");
 * }
 */
export function computeMerchantCapabilities(
	merchant: MerchantData,
): MerchantCapabilities {
	return {
		canAcceptOnlinePayment:
			env.MOLLIE_SKIP_ONBOARDING_CHECK ||
			merchant.mollieCanReceivePayments === true,
	};
}

/**
 * Compute store capabilities from merchant capabilities.
 * Store capabilities inherit from merchant and add store-specific settings.
 *
 * @example
 * const merchantCaps = computeMerchantCapabilities(store.merchant);
 * const storeCaps = computeStoreCapabilities(merchantCaps);
 * if (!storeCaps.canAcceptOnlinePayment) {
 *   return <PaymentUnavailable />;
 * }
 */
export function computeStoreCapabilities(
	merchantCapabilities: MerchantCapabilities,
): StoreCapabilities {
	return {
		canAcceptOnlinePayment: merchantCapabilities.canAcceptOnlinePayment,
	};
}
