/**
 * Hours Service
 *
 * Service facade for store hours operations.
 */

import type { Database } from "@menuvo/db";
import { storeHours, stores } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { ForbiddenError, NotFoundError } from "../../errors.js";
import type { IHoursService } from "./interface.js";
import type { SaveHoursInput } from "./types.js";

/**
 * Hours service implementation
 */
export class HoursService implements IHoursService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async get(storeId: string, merchantId: string) {
		// SECURITY: Verify the store belongs to the authenticated merchant
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.id, storeId),
			columns: { id: true, merchantId: true },
		});

		if (!store || store.merchantId !== merchantId) {
			throw new ForbiddenError("Store not found or access denied");
		}

		const hours = await this.db.query.storeHours.findMany({
			where: eq(storeHours.storeId, storeId),
			orderBy: (h, { asc }) => [asc(h.dayOfWeek), asc(h.displayOrder)],
		});

		return hours;
	}

	async save(input: SaveHoursInput, merchantId: string) {
		// Verify the store belongs to the authenticated user's merchant
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.id, input.storeId),
			columns: { id: true, merchantId: true },
		});

		if (!store || store.merchantId !== merchantId) {
			throw new ForbiddenError("You can only modify hours for your own store");
		}

		await this.db.transaction(async (tx) => {
			// Delete existing hours for this store
			await tx.delete(storeHours).where(eq(storeHours.storeId, input.storeId));

			// Insert new hours if any
			if (input.hours.length > 0) {
				await tx.insert(storeHours).values(
					input.hours.map((h) => ({
						storeId: input.storeId,
						dayOfWeek: h.dayOfWeek,
						openTime: h.openTime,
						closeTime: h.closeTime,
						displayOrder: h.displayOrder,
					})),
				);
			}
		});

		// Return updated hours
		const updatedHours = await this.db.query.storeHours.findMany({
			where: eq(storeHours.storeId, input.storeId),
			orderBy: (h, { asc }) => [asc(h.dayOfWeek), asc(h.displayOrder)],
		});

		return updatedHours;
	}

	async delete(hourId: string, merchantId: string): Promise<void> {
		// Find the hour entry and verify ownership
		const hourEntry = await this.db.query.storeHours.findFirst({
			where: eq(storeHours.id, hourId),
			with: {
				store: {
					columns: { merchantId: true },
				},
			},
		});

		if (!hourEntry) {
			throw new NotFoundError("Store hour entry not found");
		}

		if (hourEntry.store.merchantId !== merchantId) {
			throw new ForbiddenError("You can only delete hours for your own store");
		}

		await this.db.delete(storeHours).where(eq(storeHours.id, hourId));
	}
}
