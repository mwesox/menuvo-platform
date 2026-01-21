/**
 * Hours Service
 *
 * Service facade for store hours operations.
 * Uses JSONB column in store_settings table.
 */

import type { Database } from "@menuvo/db";
import {
	type StoreHoursConfig,
	storeSettings,
	stores,
} from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { ForbiddenError } from "../../errors.js";
import { sortHours } from "../utils.js";
import type { IHoursService } from "./interface.js";
import type { SaveHoursInput, StoreHourOutput } from "./types.js";

/**
 * Hours service implementation using JSONB storage
 */
export class HoursService implements IHoursService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async get(storeId: string, merchantId: string): Promise<StoreHourOutput[]> {
		// SECURITY: Verify the store belongs to the authenticated merchant
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.id, storeId),
			columns: { id: true, merchantId: true },
		});

		if (!store || store.merchantId !== merchantId) {
			throw new ForbiddenError("Store not found or access denied");
		}

		// Get hours from storeSettings JSONB
		const settings = await this.db.query.storeSettings.findFirst({
			where: eq(storeSettings.storeId, storeId),
			columns: { hours: true },
		});

		const hours = settings?.hours ?? [];
		return sortHours(hours);
	}

	async save(
		input: SaveHoursInput,
		merchantId: string,
	): Promise<StoreHourOutput[]> {
		// Verify the store belongs to the authenticated user's merchant
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.id, input.storeId),
			columns: { id: true, merchantId: true },
		});

		if (!store || store.merchantId !== merchantId) {
			throw new ForbiddenError("You can only modify hours for your own store");
		}

		// Convert input to StoreHoursConfig
		const hoursConfig: StoreHoursConfig = input.hours.map((h) => ({
			dayOfWeek: h.dayOfWeek,
			openTime: h.openTime,
			closeTime: h.closeTime,
			displayOrder: h.displayOrder,
		}));

		// Use transaction for atomicity
		await this.db.transaction(async (tx) => {
			// Upsert storeSettings with new hours
			await tx
				.insert(storeSettings)
				.values({
					storeId: input.storeId,
					hours: hoursConfig,
				})
				.onConflictDoUpdate({
					target: storeSettings.storeId,
					set: { hours: hoursConfig },
				});
		});

		// Return sorted hours
		return sortHours(hoursConfig);
	}
}
