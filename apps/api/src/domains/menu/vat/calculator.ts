/**
 * VAT Calculator
 *
 * Pure calculation functions for VAT operations.
 * German standard: back-calculate net from gross prices.
 */

import type {
	CalculatedItemVat,
	ItemWithVatInfo,
	VatCalculationResult,
	VatComponents,
	VatGroupWithRate,
	VatLineAggregate,
} from "./types.js";

/**
 * Calculate VAT components from a gross amount.
 *
 * German standard: prices shown to consumers are gross (incl. VAT).
 * We back-calculate the net amount from the gross.
 *
 * Formula:
 *   rateDecimal = rate / 10000  (700 basis points = 0.07)
 *   netAmount = grossAmount / (1 + rateDecimal)
 *   vatAmount = grossAmount - netAmount
 *
 * @param grossAmountCents - Gross amount in cents
 * @param rateBasisPoints - VAT rate in basis points (700 = 7%, 1900 = 19%)
 * @returns VAT components (net, vat, gross) all in cents
 */
export function calculateVatFromGross(
	grossAmountCents: number,
	rateBasisPoints: number,
): VatComponents {
	if (rateBasisPoints === 0) {
		return {
			netAmount: grossAmountCents,
			vatAmount: 0,
			grossAmount: grossAmountCents,
		};
	}

	const rateDecimal = rateBasisPoints / 10000;
	const netAmount = Math.round(grossAmountCents / (1 + rateDecimal));
	const vatAmount = grossAmountCents - netAmount;

	return {
		netAmount,
		vatAmount,
		grossAmount: grossAmountCents,
	};
}

/**
 * Calculate VAT for a single item with quantity.
 *
 * @param grossPriceCents - Gross price per unit in cents
 * @param quantity - Number of units
 * @param rateBasisPoints - VAT rate in basis points
 * @returns VAT components for total amount (price * quantity)
 */
export function calculateItemVat(
	grossPriceCents: number,
	quantity: number,
	rateBasisPoints: number,
): VatComponents {
	const totalGross = grossPriceCents * quantity;
	return calculateVatFromGross(totalGross, rateBasisPoints);
}

/**
 * Calculate full VAT breakdown for an order.
 *
 * @param items - Items with VAT information
 * @param vatGroups - VAT groups with rates for the country
 * @param defaultVatGroupCode - Default VAT group code for items without explicit VAT group
 * @returns Complete VAT calculation result
 */
export function calculateOrderVat(
	items: ItemWithVatInfo[],
	vatGroups: VatGroupWithRate[],
	defaultVatGroupCode = "food",
): VatCalculationResult {
	const vatGroupMap = new Map(vatGroups.map((g) => [g.id, g]));
	const vatGroupByCode = new Map(vatGroups.map((g) => [g.code, g]));
	const defaultGroup = vatGroupByCode.get(defaultVatGroupCode);

	const itemVat: CalculatedItemVat[] = [];
	const vatLineMap = new Map<string, VatLineAggregate>();

	for (const item of items) {
		// Resolve VAT group: use item's vatGroupId or fall back to default
		let group: VatGroupWithRate | undefined;
		if (item.vatGroupId) {
			group = vatGroupMap.get(item.vatGroupId);
		}
		if (!group) {
			group = defaultGroup;
		}

		// If still no group (shouldn't happen with proper setup), use 0% rate
		const vatGroupCode = group?.code ?? "unknown";
		const vatGroupName = group?.name ?? "Unknown";
		const rate = group?.rate ?? 0;

		// Calculate VAT for this item
		const components = calculateItemVat(item.grossPrice, item.quantity, rate);

		itemVat.push({
			itemId: item.itemId,
			vatGroupCode,
			vatGroupName,
			rate,
			netAmount: components.netAmount,
			vatAmount: components.vatAmount,
			grossAmount: components.grossAmount,
		});

		// Aggregate by VAT rate
		const key = `${vatGroupCode}:${rate}`;
		const existing = vatLineMap.get(key);
		if (existing) {
			existing.netAmount += components.netAmount;
			existing.vatAmount += components.vatAmount;
			existing.grossAmount += components.grossAmount;
		} else {
			vatLineMap.set(key, {
				vatGroupCode,
				vatGroupName,
				rate,
				netAmount: components.netAmount,
				vatAmount: components.vatAmount,
				grossAmount: components.grossAmount,
			});
		}
	}

	// Convert map to sorted array
	const vatLines = Array.from(vatLineMap.values()).sort(
		(a, b) => a.rate - b.rate,
	);

	// Calculate totals
	const totalNet = vatLines.reduce((sum, line) => sum + line.netAmount, 0);
	const totalVat = vatLines.reduce((sum, line) => sum + line.vatAmount, 0);
	const totalGross = vatLines.reduce((sum, line) => sum + line.grossAmount, 0);

	return {
		itemVat,
		vatLines,
		totalNet,
		totalVat,
		totalGross,
	};
}

/**
 * Format VAT rate for display.
 *
 * @param rateBasisPoints - Rate in basis points (700 = 7%)
 * @returns Formatted rate string (e.g., "7%", "19%")
 */
export function formatVatRate(rateBasisPoints: number): string {
	const percentage = rateBasisPoints / 100;
	return `${percentage}%`;
}
