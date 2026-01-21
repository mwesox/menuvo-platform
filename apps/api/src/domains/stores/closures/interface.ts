/**
 * Closures Service Interface
 *
 * Defines the contract for store closure operations.
 */

import type {
	CreateClosureInput,
	DeleteClosureInput,
	GetClosureByIdInput,
	StoreClosureOutput,
	UpdateClosureInput,
} from "./types.js";

/**
 * Closures service interface
 */
export interface IClosuresService {
	list(storeId: string, merchantId: string): Promise<StoreClosureOutput[]>;

	getById(
		input: GetClosureByIdInput,
		merchantId: string,
	): Promise<StoreClosureOutput>;

	create(
		input: CreateClosureInput,
		merchantId: string,
	): Promise<StoreClosureOutput>;

	update(
		input: UpdateClosureInput,
		merchantId: string,
	): Promise<StoreClosureOutput>;

	delete(input: DeleteClosureInput, merchantId: string): Promise<void>;
}
