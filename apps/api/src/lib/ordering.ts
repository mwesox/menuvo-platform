/**
 * Fractional Indexing Utilities
 *
 * Uses fractional indexing for displayOrder to enable single-update reordering.
 * Instead of integers (0, 1, 2, 3), we use strings that sort lexicographically
 * and allow inserting between any two values with a single update.
 *
 * Benefits:
 * - Reordering requires only 1 database update (the moved item)
 * - No N+1 updates when inserting or moving items
 * - Maintains correct ordering in all database queries
 */

import { generateKeyBetween } from "fractional-indexing";

/**
 * Generate a display order key for appending to end of list.
 *
 * @param lastKey - The current last item's order key, or null if list is empty
 * @returns A new order key that sorts after lastKey
 *
 * @example
 * generateOrderKey(null)  // "a0" (first item)
 * generateOrderKey("a0")  // "a1" (second item)
 * generateOrderKey("a1")  // "a2" (third item)
 */
export function generateOrderKey(lastKey: string | null): string {
	return generateKeyBetween(lastKey, null);
}

/**
 * Generate a display order key between two items (for reordering).
 *
 * @param before - The order key of the item that should come before, or null for start
 * @param after - The order key of the item that should come after, or null for end
 * @returns A new order key that sorts between before and after
 *
 * @example
 * // Insert between "a0" and "a1"
 * generateOrderKeyBetween("a0", "a1")  // "a0V" (sorts between)
 *
 * // Move to start
 * generateOrderKeyBetween(null, "a0")  // "Zz" (sorts before "a0")
 *
 * // Move to end
 * generateOrderKeyBetween("a2", null)  // "a3" (sorts after "a2")
 */
export function generateOrderKeyBetween(
	before: string | null,
	after: string | null,
): string {
	return generateKeyBetween(before, after);
}

/**
 * Generate multiple consecutive order keys for bulk inserts.
 *
 * @param lastKey - The current last item's order key, or null if list is empty
 * @param count - Number of keys to generate
 * @returns Array of order keys in sequence
 *
 * @example
 * generateOrderKeys(null, 3)  // ["a0", "a1", "a2"]
 * generateOrderKeys("a2", 2)  // ["a3", "a4"]
 */
export function generateOrderKeys(
	lastKey: string | null,
	count: number,
): string[] {
	const keys: string[] = [];
	let currentKey = lastKey;

	for (let i = 0; i < count; i++) {
		currentKey = generateKeyBetween(currentKey, null);
		keys.push(currentKey);
	}

	return keys;
}
