/**
 * Pure functions for order price calculations.
 * All prices are in cents to avoid floating point issues.
 */

import type { OrderItemInput, OrderItemOptionInput } from "../types";

/**
 * Calculate the total price for a single item including options
 */
export function calculateItemTotal(
	unitPrice: number,
	quantity: number,
	options: OrderItemOptionInput[],
): number {
	const optionsPrice = calculateOptionsPrice(options);
	return (unitPrice + optionsPrice) * quantity;
}

/**
 * Calculate total price of all selected options for one unit
 */
export function calculateOptionsPrice(options: OrderItemOptionInput[]): number {
	return options.reduce(
		(sum, opt) => sum + opt.priceModifier * opt.quantity,
		0,
	);
}

/**
 * Calculate subtotal from all order items
 */
export function calculateSubtotal(items: OrderItemInput[]): number {
	return items.reduce((sum, item) => sum + item.totalPrice, 0);
}

/**
 * Calculate tax amount from subtotal
 * @param subtotal - Subtotal in cents
 * @param taxRate - Tax rate as decimal (e.g., 0.19 for 19%)
 */
export function calculateTax(subtotal: number, taxRate: number): number {
	return Math.round(subtotal * taxRate);
}

/**
 * Calculate total amount including tax and tip
 */
export function calculateTotal(
	subtotal: number,
	taxAmount: number,
	tipAmount: number,
): number {
	return subtotal + taxAmount + tipAmount;
}

/**
 * Validate that item prices match calculated values
 * Used to verify cart hasn't been tampered with
 */
export function validateItemPricing(item: OrderItemInput): boolean {
	const expectedOptionsPrice = calculateOptionsPrice(item.options);
	const expectedTotal = (item.unitPrice + expectedOptionsPrice) * item.quantity;

	return (
		item.optionsPrice === expectedOptionsPrice &&
		item.totalPrice === expectedTotal
	);
}

/**
 * Validate all items in an order
 */
export function validateOrderPricing(items: OrderItemInput[]): boolean {
	return items.every(validateItemPricing);
}

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
