/**
 * Store Settings Service Interface
 *
 * Defines the contract for store settings operations.
 */

import type { SaveOrderTypesInput } from "./schemas.js";
import type { EnabledOrderTypes, StoreSettings } from "./types.js";

/**
 * Store settings service interface
 */
export interface IStoreSettingsService {
	/**
	 * Get full settings for a store (console use)
	 * Requires merchant ownership verification
	 */
	getSettings(storeId: string, merchantId: string): Promise<StoreSettings>;

	/**
	 * Get enabled order types for a store by slug (shop use, public)
	 */
	getOrderTypes(storeSlug: string): Promise<EnabledOrderTypes>;

	/**
	 * Save order types configuration
	 * Requires merchant ownership verification
	 */
	saveOrderTypes(
		input: SaveOrderTypesInput,
		merchantId: string,
	): Promise<StoreSettings>;
}
