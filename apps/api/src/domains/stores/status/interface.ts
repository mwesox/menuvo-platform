/**
 * Store Status Service Interface
 *
 * Defines the contract for store status operations.
 */

import type { PickupSlotsResponse, StoreStatus } from "./types.js";

/**
 * Store status service interface
 */
export interface IStoreStatusService {
	/**
	 * Get store status by slug (public - for shop storefront)
	 * Returns whether store is currently open and next opening time
	 */
	getStatusBySlug(slug: string): Promise<StoreStatus>;

	/**
	 * Get available pickup time slots for a store
	 * Returns formatted time slots with labels for the next 7 days
	 */
	getAvailablePickupSlots(
		slug: string,
		date?: string,
		languageCode?: string,
	): Promise<PickupSlotsResponse>;
}
