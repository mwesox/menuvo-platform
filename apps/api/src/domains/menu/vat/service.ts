/**
 * VAT Service
 *
 * Service facade for VAT operations.
 * VAT groups are merchant-managed - each merchant defines their own VAT groups and rates.
 */

import type { Database } from "@menuvo/db";
import { vatGroups } from "@menuvo/db/schema";
import { and, asc, eq, max } from "drizzle-orm";
import {
	ConflictError,
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from "../../errors.js";
import {
	calculateOrderVat as calcOrderVat,
	calculateVatFromGross as calcVatFromGross,
} from "./calculator.js";
import type {
	CreateVatGroupInput,
	IVatService,
	UpdateVatGroupInput,
} from "./interface.js";
import type {
	ItemWithVatInfo,
	VatCalculationResult,
	VatComponents,
	VatGroupWithRate,
} from "./types.js";

/**
 * VAT service implementation
 */
export class VatService implements IVatService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getVatGroupsForMerchant(
		merchantId: string,
	): Promise<VatGroupWithRate[]> {
		const groups = await this.db.query.vatGroups.findMany({
			where: eq(vatGroups.merchantId, merchantId),
			orderBy: [asc(vatGroups.displayOrder)],
		});

		return groups.map((group) => ({
			id: group.id,
			code: group.code,
			name: group.name,
			description: group.description,
			displayOrder: group.displayOrder,
			rate: group.rate,
		}));
	}

	async getVatGroupById(
		vatGroupId: string,
		merchantId: string,
	): Promise<VatGroupWithRate | null> {
		const group = await this.db.query.vatGroups.findFirst({
			where: eq(vatGroups.id, vatGroupId),
		});

		// Verify ownership
		if (!group || group.merchantId !== merchantId) {
			return null;
		}

		return {
			id: group.id,
			code: group.code,
			name: group.name,
			description: group.description,
			displayOrder: group.displayOrder,
			rate: group.rate,
		};
	}

	async create(
		merchantId: string,
		input: CreateVatGroupInput,
	): Promise<VatGroupWithRate> {
		// Check for duplicate code
		const existing = await this.db.query.vatGroups.findFirst({
			where: and(
				eq(vatGroups.merchantId, merchantId),
				eq(vatGroups.code, input.code),
			),
		});

		if (existing) {
			throw new ConflictError(
				`VAT group with code "${input.code}" already exists`,
			);
		}

		// Get max displayOrder if not provided
		let displayOrder = input.displayOrder;
		if (displayOrder === undefined) {
			const result = await this.db
				.select({ maxOrder: max(vatGroups.displayOrder) })
				.from(vatGroups)
				.where(eq(vatGroups.merchantId, merchantId));
			displayOrder = (result[0]?.maxOrder ?? -1) + 1;
		}

		const [group] = await this.db
			.insert(vatGroups)
			.values({
				merchantId,
				code: input.code,
				name: input.name,
				description: input.description ?? null,
				rate: input.rate,
				displayOrder,
			})
			.returning();

		if (!group) {
			throw new ValidationError("Failed to create VAT group");
		}

		return {
			id: group.id,
			code: group.code,
			name: group.name,
			description: group.description,
			displayOrder: group.displayOrder,
			rate: group.rate,
		};
	}

	async update(
		vatGroupId: string,
		merchantId: string,
		input: UpdateVatGroupInput,
	): Promise<VatGroupWithRate> {
		// Verify ownership
		const existing = await this.db.query.vatGroups.findFirst({
			where: eq(vatGroups.id, vatGroupId),
		});

		if (!existing) {
			throw new NotFoundError("VAT group not found");
		}

		if (existing.merchantId !== merchantId) {
			throw new ForbiddenError(
				"You do not have permission to update this VAT group",
			);
		}

		// Build update object with only defined fields
		const updateData: Record<string, unknown> = {};
		if (input.name !== undefined) updateData.name = input.name;
		if (input.description !== undefined)
			updateData.description = input.description;
		if (input.rate !== undefined) updateData.rate = input.rate;
		if (input.displayOrder !== undefined)
			updateData.displayOrder = input.displayOrder;

		if (Object.keys(updateData).length === 0) {
			return {
				id: existing.id,
				code: existing.code,
				name: existing.name,
				description: existing.description,
				displayOrder: existing.displayOrder,
				rate: existing.rate,
			};
		}

		const [group] = await this.db
			.update(vatGroups)
			.set(updateData)
			.where(eq(vatGroups.id, vatGroupId))
			.returning();

		if (!group) {
			throw new ValidationError("Failed to update VAT group");
		}

		return {
			id: group.id,
			code: group.code,
			name: group.name,
			description: group.description,
			displayOrder: group.displayOrder,
			rate: group.rate,
		};
	}

	async delete(vatGroupId: string, merchantId: string): Promise<void> {
		// Verify ownership
		const existing = await this.db.query.vatGroups.findFirst({
			where: eq(vatGroups.id, vatGroupId),
		});

		if (!existing) {
			throw new NotFoundError("VAT group not found");
		}

		if (existing.merchantId !== merchantId) {
			throw new ForbiddenError(
				"You do not have permission to delete this VAT group",
			);
		}

		await this.db.delete(vatGroups).where(eq(vatGroups.id, vatGroupId));
	}

	calculateVatFromGross(
		grossAmountCents: number,
		rateBasisPoints: number,
	): VatComponents {
		return calcVatFromGross(grossAmountCents, rateBasisPoints);
	}

	calculateOrderVat(
		items: ItemWithVatInfo[],
		vatGroups: VatGroupWithRate[],
		defaultVatGroupCode = "food",
	): VatCalculationResult {
		return calcOrderVat(items, vatGroups, defaultVatGroupCode);
	}
}
