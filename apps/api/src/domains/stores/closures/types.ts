/**
 * Store Closures Domain Types
 */

export interface CreateClosureInput {
	storeId: string;
	startDate: string;
	endDate: string;
	reason?: string;
}

export interface UpdateClosureInput {
	storeId: string;
	closureId: string;
	startDate?: string;
	endDate?: string;
	reason?: string | null;
}

export interface DeleteClosureInput {
	storeId: string;
	closureId: string;
}

export interface GetClosureByIdInput {
	storeId: string;
	closureId: string;
}

/**
 * Output type for store closures (matches JSONB structure)
 */
export interface StoreClosureOutput {
	id: string;
	startDate: string;
	endDate: string;
	reason: string | null;
}
