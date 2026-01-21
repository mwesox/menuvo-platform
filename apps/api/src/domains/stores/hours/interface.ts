/**
 * Hours Service Interface
 *
 * Defines the contract for store hours operations.
 * Note: Individual hour deletion is not supported with JSONB storage.
 * Use save() to replace all hours at once.
 */

import type { SaveHoursInput, StoreHourOutput } from "./types.js";

/**
 * Hours service interface
 */
export interface IHoursService {
	get(storeId: string, merchantId: string): Promise<StoreHourOutput[]>;

	save(input: SaveHoursInput, merchantId: string): Promise<StoreHourOutput[]>;
}
