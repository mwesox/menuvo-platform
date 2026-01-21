/**
 * Store Hours Domain Types
 */

import type { DayOfWeek } from "@menuvo/db/schema";

export interface StoreHourInput {
	dayOfWeek: DayOfWeek;
	openTime: string;
	closeTime: string;
	displayOrder: number;
}

export interface SaveHoursInput {
	storeId: string;
	hours: StoreHourInput[];
}

/**
 * Output type for store hours (matches JSONB structure)
 */
export interface StoreHourOutput {
	dayOfWeek: DayOfWeek;
	openTime: string;
	closeTime: string;
	displayOrder: number;
}
