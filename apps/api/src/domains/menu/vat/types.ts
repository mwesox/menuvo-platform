/**
 * VAT Service Types
 *
 * Type definitions for VAT calculations and service operations.
 */

/**
 * VAT group with its rate
 */
export interface VatGroupWithRate {
	id: string;
	code: string;
	name: string;
	description: string | null;
	displayOrder: number;
	/** Rate in basis points (700 = 7%, 1900 = 19%) */
	rate: number;
}

/**
 * Components of a VAT calculation (all amounts in cents)
 */
export interface VatComponents {
	/** Net amount before VAT */
	netAmount: number;
	/** VAT amount */
	vatAmount: number;
	/** Gross amount including VAT (original amount) */
	grossAmount: number;
}

/**
 * Item with VAT information for order calculation
 */
export interface ItemWithVatInfo {
	/** Item ID */
	itemId: string;
	/** Gross price in cents */
	grossPrice: number;
	/** Quantity ordered */
	quantity: number;
	/** VAT group ID (resolved from item or category) */
	vatGroupId: string | null;
}

/**
 * Option choice with VAT information for order calculation
 */
export interface OptionChoiceWithVatInfo {
	/** Option choice ID */
	optionChoiceId: string;
	/** Gross price modifier in cents */
	grossPriceModifier: number;
	/** Quantity selected */
	quantity: number;
	/** VAT group ID (resolved from choice, item, or category) */
	vatGroupId: string | null;
}

/**
 * Calculated VAT line for an item in an order
 */
export interface CalculatedItemVat {
	itemId: string;
	vatGroupCode: string;
	vatGroupName: string;
	/** Rate in basis points */
	rate: number;
	/** Net amount in cents */
	netAmount: number;
	/** VAT amount in cents */
	vatAmount: number;
	/** Gross amount in cents */
	grossAmount: number;
}

/**
 * Aggregated VAT line for order receipt
 */
export interface VatLineAggregate {
	vatGroupCode: string;
	vatGroupName: string;
	/** Rate in basis points */
	rate: number;
	/** Total net amount for this rate */
	netAmount: number;
	/** Total VAT amount for this rate */
	vatAmount: number;
	/** Total gross amount for this rate */
	grossAmount: number;
}

/**
 * Complete VAT calculation result for an order
 */
export interface VatCalculationResult {
	/** VAT breakdown per item */
	itemVat: CalculatedItemVat[];
	/** Aggregated VAT lines for receipt */
	vatLines: VatLineAggregate[];
	/** Total net amount */
	totalNet: number;
	/** Total VAT amount */
	totalVat: number;
	/** Total gross amount */
	totalGross: number;
}
