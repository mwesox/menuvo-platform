/**
 * VAT Service Interface
 *
 * Contract for VAT service operations.
 */

import type {
	ItemWithVatInfo,
	VatCalculationResult,
	VatComponents,
	VatGroupWithRate,
} from "./types.js";

export interface CreateVatGroupInput {
	code: string;
	name: string;
	description?: string;
	rate: number;
	displayOrder?: number;
}

export interface UpdateVatGroupInput {
	name?: string;
	description?: string | null;
	rate?: number;
	displayOrder?: number;
}

/**
 * VAT Service Interface
 *
 * Provides VAT group lookups and calculation utilities.
 * VAT groups are merchant-managed - each merchant defines their own.
 */
export interface IVatService {
	/**
	 * Get all VAT groups for a merchant.
	 *
	 * @param merchantId - Merchant ID
	 * @returns Array of VAT groups with their rates
	 */
	getVatGroupsForMerchant(merchantId: string): Promise<VatGroupWithRate[]>;

	/**
	 * Get a VAT group by ID, verifying merchant ownership.
	 *
	 * @param vatGroupId - VAT group ID
	 * @param merchantId - Merchant ID (for ownership verification)
	 * @returns VAT group with rate, or null if not found/not owned
	 */
	getVatGroupById(
		vatGroupId: string,
		merchantId: string,
	): Promise<VatGroupWithRate | null>;

	/**
	 * Create a new VAT group for a merchant.
	 *
	 * @param merchantId - Merchant ID
	 * @param input - VAT group data
	 * @returns Created VAT group
	 */
	create(
		merchantId: string,
		input: CreateVatGroupInput,
	): Promise<VatGroupWithRate>;

	/**
	 * Update a VAT group.
	 *
	 * @param vatGroupId - VAT group ID
	 * @param merchantId - Merchant ID (for ownership verification)
	 * @param input - Fields to update
	 * @returns Updated VAT group
	 */
	update(
		vatGroupId: string,
		merchantId: string,
		input: UpdateVatGroupInput,
	): Promise<VatGroupWithRate>;

	/**
	 * Delete a VAT group.
	 *
	 * @param vatGroupId - VAT group ID
	 * @param merchantId - Merchant ID (for ownership verification)
	 */
	delete(vatGroupId: string, merchantId: string): Promise<void>;

	/**
	 * Calculate VAT components from a gross amount.
	 *
	 * @param grossAmountCents - Gross amount in cents
	 * @param rateBasisPoints - VAT rate in basis points (700 = 7%)
	 * @returns VAT components (net, vat, gross)
	 */
	calculateVatFromGross(
		grossAmountCents: number,
		rateBasisPoints: number,
	): VatComponents;

	/**
	 * Calculate full VAT breakdown for an order.
	 *
	 * @param items - Items with resolved VAT group IDs
	 * @param vatGroups - VAT groups with rates (from getVatGroupsForMerchant)
	 * @param defaultVatGroupCode - Default VAT group code (default: "food")
	 * @returns Complete VAT calculation result
	 */
	calculateOrderVat(
		items: ItemWithVatInfo[],
		vatGroups: VatGroupWithRate[],
		defaultVatGroupCode?: string,
	): VatCalculationResult;
}
