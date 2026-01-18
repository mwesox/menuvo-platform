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
	startDate?: string;
	endDate?: string;
	reason?: string | null;
}
