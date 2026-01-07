import type { MenuItem, MenuItemWithDefaults } from "./schemas";

// Re-export price formatting utilities from the centralized location
export { formatPrice, formatPriceModifier } from "@/components/ui/price-input";

/**
 * @deprecated Since API now returns isDefault directly, this is a pass-through.
 * Kept for backward compatibility but can be removed once all callers are updated.
 */
export function enrichMenuItemWithDefaults(
	item: MenuItem,
): MenuItemWithDefaults {
	// API now returns all default/quantity fields directly
	// This function is now a pass-through for backward compatibility
	return item as MenuItemWithDefaults;
}

/**
 * Selected option structure for cart items.
 */
interface SelectedOption {
	groupId: string;
	groupName: string;
	choices: { id: string; name: string; price: number }[];
}

/**
 * Generate a unique cart item ID by hashing itemId + sorted option choice IDs.
 * This allows identifying items with the same base item but different option selections.
 * @param itemId - The menu item ID
 * @param options - The selected options for this cart item
 * @returns A unique string ID for the cart item
 */
export function generateCartItemId(
	itemId: string,
	options: SelectedOption[],
): string {
	// Extract all choice IDs, sort them, and join with the item ID
	const choiceIds = options
		.flatMap((opt) => opt.choices.map((c) => c.id))
		.sort();

	// Create a simple hash from itemId and sorted choice IDs
	const hashInput = `${itemId}:${choiceIds.join(",")}`;

	// Simple hash function for generating a unique ID
	let hash = 0;
	for (let i = 0; i < hashInput.length; i++) {
		const char = hashInput.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}

	return `cart-${itemId}-${Math.abs(hash).toString(36)}`;
}
