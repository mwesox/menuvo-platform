/**
 * Store Settings Domain Types
 */

import type { OrderTypesConfig } from "@menuvo/db/schema";

/**
 * Order type key
 */
export type OrderTypeKey = "dine_in" | "takeaway" | "delivery";

/**
 * Single order type configuration
 */
export interface OrderTypeConfig {
	enabled: boolean;
	displayOrder: number;
}

/**
 * Full settings for console (includes storeId)
 */
export interface StoreSettings {
	storeId: string;
	orderTypes: OrderTypesConfig;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * Enabled order types for shop (public, minimal data)
 */
export interface EnabledOrderTypes {
	dine_in: boolean;
	takeaway: boolean;
	delivery: boolean;
}

/**
 * Default order types configuration (all enabled)
 */
export const DEFAULT_ORDER_TYPES: OrderTypesConfig = {
	dine_in: { enabled: true, displayOrder: 0 },
	takeaway: { enabled: true, displayOrder: 1 },
	delivery: { enabled: true, displayOrder: 2 },
};
