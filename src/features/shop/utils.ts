/**
 * Format a price in cents to a currency string.
 * @param cents - The price in cents
 * @param currency - The currency code (default: "EUR")
 * @returns Formatted price string (e.g., "$12.99")
 */
export function formatPrice(cents: number, currency = "EUR"): string {
	const formatter = new Intl.NumberFormat(undefined, {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});

	return formatter.format(cents / 100);
}

/**
 * Selected option structure for cart items.
 */
interface SelectedOption {
	groupId: number;
	groupName: string;
	choices: { id: number; name: string; price: number }[];
}

/**
 * Generate a unique cart item ID by hashing itemId + sorted option choice IDs.
 * This allows identifying items with the same base item but different option selections.
 * @param itemId - The menu item ID
 * @param options - The selected options for this cart item
 * @returns A unique string ID for the cart item
 */
export function generateCartItemId(
	itemId: number,
	options: SelectedOption[],
): string {
	// Extract all choice IDs, sort them, and join with the item ID
	const choiceIds = options
		.flatMap((opt) => opt.choices.map((c) => c.id))
		.sort((a, b) => a - b);

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
