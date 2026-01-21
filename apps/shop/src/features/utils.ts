/**
 * Format a price in cents to a localized currency string.
 * @param cents - The price in cents
 * @param currency - The currency code (default: "EUR")
 * @param locale - The locale for formatting (default: "de-DE")
 * @returns Formatted price string (e.g., "12,99 €")
 */
export function formatPrice(
	cents: number,
	currency = "EUR",
	locale = "de-DE",
): string {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(cents / 100);
}

/**
 * Format a price modifier (can be positive or negative) with appropriate sign.
 * Uses proper typographic minus sign (U+2212) for negative values.
 * @param cents - The price modifier in cents
 * @param currency - The currency code (default: "EUR")
 * @param locale - The locale for formatting (default: "de-DE")
 * @returns Formatted string with sign (e.g., "+2,20 €" or "−2,20 €")
 */
export function formatPriceModifier(
	cents: number,
	currency = "EUR",
	locale = "de-DE",
): string {
	const formatted = formatPrice(Math.abs(cents), currency, locale);

	if (cents > 0) {
		return `+${formatted}`;
	}
	if (cents < 0) {
		return `−${formatted}`; // Using proper minus sign (U+2212)
	}
	return formatted;
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
