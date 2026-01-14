/**
 * Closures Service Interface
 *
 * Defines the contract for store closure operations.
 */

import type { storeClosures } from "@menuvo/db/schema";
import type { CreateClosureInput, UpdateClosureInput } from "./types.js";

/**
 * Closures service interface
 */
export interface IClosuresService {
	list(
		storeId: string,
		merchantId: string,
	): Promise<(typeof storeClosures.$inferSelect)[]>;
	getById(
		closureId: string,
		merchantId: string,
	): Promise<typeof storeClosures.$inferSelect>;
	create(input: CreateClosureInput): Promise<typeof storeClosures.$inferSelect>;
	update(
		closureId: string,
		merchantId: string,
		input: UpdateClosureInput,
	): Promise<typeof storeClosures.$inferSelect>;
	delete(closureId: string, merchantId: string): Promise<void>;
}
