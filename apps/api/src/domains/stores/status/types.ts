/**
 * Store Status Types
 *
 * Type definitions for store status operations.
 */

/**
 * Store status response
 */
export interface StoreStatus {
	/** Whether the store is currently open */
	isOpen: boolean;
	/** Next opening time as ISO string, or null if no future opening time */
	nextOpenTime: string | null;
}

/**
 * Pickup time slot
 */
export interface PickupSlot {
	/** ISO datetime string for the slot */
	datetime: string;
	/** Human-readable label (e.g., "Today, 14:30", "Tomorrow, 10:00") */
	label: string;
}

/**
 * Pickup slots response
 */
export interface PickupSlotsResponse {
	slots: PickupSlot[];
}
