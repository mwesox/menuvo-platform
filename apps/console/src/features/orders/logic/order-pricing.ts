/**
 * Pure functions for order price calculations.
 * All prices are in cents to avoid floating point issues.
 */

/**
 * Format price in cents to display string
 * @param cents - Price in cents
 * @param currency - Currency code (default EUR)
 */
export function formatPrice(cents: number, currency = "EUR"): string {
	return new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency,
	}).format(cents / 100);
}
