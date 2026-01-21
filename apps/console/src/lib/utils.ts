// Simple className utility - can be replaced with Chakra's className prop or removed if not needed
export function cn(...classes: (string | undefined | null | false)[]): string {
	return classes.filter(Boolean).join(" ");
}

export const minutes = (n: number) => n * 60 * 1000;

/**
 * Format cents as currency (EUR)
 */
export function formatCurrency(cents: number): string {
	return new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency: "EUR",
	}).format(cents / 100);
}
