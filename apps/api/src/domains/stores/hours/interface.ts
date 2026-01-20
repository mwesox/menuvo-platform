/**
 * Hours Service Interface
 *
 * Defines the contract for store hours operations.
 */

import type { storeHours } from "@menuvo/db/schema";
import type { SaveHoursInput } from "./types.js";

/**
 * Hours service interface
 */
export interface IHoursService {
	get(
		storeId: string,
		merchantId: string,
	): Promise<(typeof storeHours.$inferSelect)[]>;

	save(
		input: SaveHoursInput,
		merchantId: string,
	): Promise<(typeof storeHours.$inferSelect)[]>;

	delete(hourId: string, merchantId: string): Promise<void>;
}
