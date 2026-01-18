/**
 * Store Hours Domain Types
 */

import type { DayOfWeek } from "./schemas.js";

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
