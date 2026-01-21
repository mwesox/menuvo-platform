/**
 * Closures Service
 *
 * Service facade for store closure operations.
 * Uses JSONB column in store_settings table.
 */

import type { Database } from "@menuvo/db";
import {
	type StoreClosuresConfig,
	storeSettings,
	stores,
} from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import {
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from "../../errors.js";
import type { IClosuresService } from "./interface.js";
import type {
	CreateClosureInput,
	DeleteClosureInput,
	GetClosureByIdInput,
	StoreClosureOutput,
	UpdateClosureInput,
} from "./types.js";

/**
 * Closures service implementation using JSONB storage
 */
export class ClosuresService implements IClosuresService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	/**
	 * Verify store ownership and return the store
	 */
	private async verifyStoreOwnership(
		storeId: string,
		merchantId: string,
	): Promise<void> {
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.id, storeId),
			columns: { id: true, merchantId: true },
		});

		if (!store) {
			throw new NotFoundError("Store not found");
		}

		if (store.merchantId !== merchantId) {
			throw new ForbiddenError("You do not have access to this store");
		}
	}

	/**
	 * Get closures from storeSettings for a specific store
	 */
	private async getClosuresForStore(
		storeId: string,
	): Promise<StoreClosuresConfig> {
		const settings = await this.db.query.storeSettings.findFirst({
			where: eq(storeSettings.storeId, storeId),
			columns: { closures: true },
		});
		return settings?.closures ?? [];
	}

	async list(
		storeId: string,
		merchantId: string,
	): Promise<StoreClosureOutput[]> {
		await this.verifyStoreOwnership(storeId, merchantId);

		const closures = await this.getClosuresForStore(storeId);

		// Sort by start date
		return closures
			.map((c) => ({
				id: c.id,
				startDate: c.startDate,
				endDate: c.endDate,
				reason: c.reason,
			}))
			.sort((a, b) => a.startDate.localeCompare(b.startDate));
	}

	async getById(
		input: GetClosureByIdInput,
		merchantId: string,
	): Promise<StoreClosureOutput> {
		await this.verifyStoreOwnership(input.storeId, merchantId);

		const closures = await this.getClosuresForStore(input.storeId);
		const closure = closures.find((c) => c.id === input.closureId);

		if (!closure) {
			throw new NotFoundError("Closure not found");
		}

		return {
			id: closure.id,
			startDate: closure.startDate,
			endDate: closure.endDate,
			reason: closure.reason,
		};
	}

	async create(
		input: CreateClosureInput,
		merchantId: string,
	): Promise<StoreClosureOutput> {
		// Verify store ownership at service layer for defense in depth
		await this.verifyStoreOwnership(input.storeId, merchantId);

		// Use transaction to prevent race conditions
		return await this.db.transaction(async (tx) => {
			// Get existing closures within transaction
			const settings = await tx.query.storeSettings.findFirst({
				where: eq(storeSettings.storeId, input.storeId),
				columns: { closures: true },
			});

			const existingClosures = settings?.closures ?? [];

			// Check for overlapping closures
			const newStart = new Date(input.startDate);
			const newEnd = new Date(input.endDate);

			for (const existing of existingClosures) {
				const existStart = new Date(existing.startDate);
				const existEnd = new Date(existing.endDate);

				if (newStart <= existEnd && newEnd >= existStart) {
					throw new ValidationError(
						`This closure overlaps with an existing closure (${existing.startDate} to ${existing.endDate})`,
					);
				}
			}

			// Create new closure with UUID
			const newClosure: StoreClosuresConfig[number] = {
				id: crypto.randomUUID(),
				startDate: input.startDate,
				endDate: input.endDate,
				reason: input.reason ?? null,
			};

			// Add to array
			const updatedClosures: StoreClosuresConfig = [
				...existingClosures,
				newClosure,
			];

			// Upsert storeSettings with new closures
			await tx
				.insert(storeSettings)
				.values({
					storeId: input.storeId,
					closures: updatedClosures,
				})
				.onConflictDoUpdate({
					target: storeSettings.storeId,
					set: { closures: updatedClosures },
				});

			return {
				id: newClosure.id,
				startDate: newClosure.startDate,
				endDate: newClosure.endDate,
				reason: newClosure.reason,
			};
		});
	}

	async update(
		input: UpdateClosureInput,
		merchantId: string,
	): Promise<StoreClosureOutput> {
		await this.verifyStoreOwnership(input.storeId, merchantId);

		// Use transaction to prevent race conditions
		return await this.db.transaction(async (tx) => {
			// Get existing closures within transaction
			const settings = await tx.query.storeSettings.findFirst({
				where: eq(storeSettings.storeId, input.storeId),
				columns: { closures: true },
			});

			const closures = settings?.closures ?? [];
			const closureIndex = closures.findIndex((c) => c.id === input.closureId);

			const existingClosure = closures[closureIndex];
			if (!existingClosure) {
				throw new NotFoundError("Closure not found");
			}

			// Determine final dates for validation
			const finalStartDate = input.startDate ?? existingClosure.startDate;
			const finalEndDate = input.endDate ?? existingClosure.endDate;

			if (new Date(finalEndDate) < new Date(finalStartDate)) {
				throw new ValidationError("End date must be on or after start date");
			}

			// Check for overlapping closures (excluding current)
			const newStart = new Date(finalStartDate);
			const newEnd = new Date(finalEndDate);

			for (const other of closures) {
				if (other.id === input.closureId) continue;

				const otherStart = new Date(other.startDate);
				const otherEnd = new Date(other.endDate);

				if (newStart <= otherEnd && newEnd >= otherStart) {
					throw new ValidationError(
						`This closure would overlap with an existing closure (${other.startDate} to ${other.endDate})`,
					);
				}
			}

			// Update closure
			const updatedClosure: StoreClosuresConfig[number] = {
				id: input.closureId,
				startDate: finalStartDate,
				endDate: finalEndDate,
				reason:
					input.reason !== undefined
						? (input.reason ?? null)
						: existingClosure.reason,
			};

			// Replace in array
			const updatedClosures: StoreClosuresConfig = [
				...closures.slice(0, closureIndex),
				updatedClosure,
				...closures.slice(closureIndex + 1),
			];

			// Update storeSettings
			await tx
				.update(storeSettings)
				.set({ closures: updatedClosures })
				.where(eq(storeSettings.storeId, input.storeId));

			return {
				id: updatedClosure.id,
				startDate: updatedClosure.startDate,
				endDate: updatedClosure.endDate,
				reason: updatedClosure.reason,
			};
		});
	}

	async delete(input: DeleteClosureInput, merchantId: string): Promise<void> {
		await this.verifyStoreOwnership(input.storeId, merchantId);

		// Use transaction to prevent race conditions
		await this.db.transaction(async (tx) => {
			// Get existing closures within transaction
			const settings = await tx.query.storeSettings.findFirst({
				where: eq(storeSettings.storeId, input.storeId),
				columns: { closures: true },
			});

			const closures = settings?.closures ?? [];
			const closureExists = closures.some((c) => c.id === input.closureId);

			if (!closureExists) {
				throw new NotFoundError("Closure not found");
			}

			// Remove from array
			const updatedClosures: StoreClosuresConfig = closures.filter(
				(c) => c.id !== input.closureId,
			);

			// Update storeSettings
			await tx
				.update(storeSettings)
				.set({ closures: updatedClosures })
				.where(eq(storeSettings.storeId, input.storeId));
		});
	}
}
