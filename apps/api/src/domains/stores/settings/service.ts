/**
 * Store Settings Service
 *
 * Service facade for store settings operations.
 */

import type { Database } from "@menuvo/db";
import { storeSettings, stores } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import {
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from "../../errors.js";
import type { IStoreSettingsService } from "./interface.js";
import type { SaveOrderTypesInput } from "./schemas.js";
import type { EnabledOrderTypes, StoreSettings } from "./types.js";
import { DEFAULT_ORDER_TYPES } from "./types.js";

/**
 * Store settings service implementation
 */
export class StoreSettingsService implements IStoreSettingsService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async getSettings(
		storeId: string,
		merchantId: string,
	): Promise<StoreSettings> {
		// Verify store belongs to merchant
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.id, storeId),
			columns: { id: true, merchantId: true },
		});

		if (!store || store.merchantId !== merchantId) {
			throw new ForbiddenError("Store not found or access denied");
		}

		// Get settings row (may not exist)
		const settings = await this.db.query.storeSettings.findFirst({
			where: eq(storeSettings.storeId, storeId),
		});

		// Return settings with defaults if not found
		if (!settings) {
			return {
				storeId,
				orderTypes: DEFAULT_ORDER_TYPES,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
		}

		return {
			storeId: settings.storeId,
			orderTypes: settings.orderTypes ?? DEFAULT_ORDER_TYPES,
			createdAt: settings.createdAt,
			updatedAt: settings.updatedAt,
		};
	}

	async getOrderTypes(storeSlug: string): Promise<EnabledOrderTypes> {
		// Find store by slug
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.slug, storeSlug),
			columns: { id: true, isActive: true },
			with: {
				settings: true,
			},
		});

		if (!store || !store.isActive) {
			throw new NotFoundError("Store not found");
		}

		// Get order types config or use defaults
		const orderTypes = store.settings?.orderTypes ?? DEFAULT_ORDER_TYPES;

		return {
			dine_in: orderTypes.dine_in.enabled,
			takeaway: orderTypes.takeaway.enabled,
			delivery: orderTypes.delivery.enabled,
		};
	}

	async saveOrderTypes(
		input: SaveOrderTypesInput,
		merchantId: string,
	): Promise<StoreSettings> {
		// Verify store belongs to merchant
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.id, input.storeId),
			columns: { id: true, merchantId: true },
		});

		if (!store || store.merchantId !== merchantId) {
			throw new ForbiddenError(
				"You can only modify settings for your own store",
			);
		}

		// Upsert settings
		const [upsertedSettings] = await this.db
			.insert(storeSettings)
			.values({
				storeId: input.storeId,
				orderTypes: input.orderTypes,
			})
			.onConflictDoUpdate({
				target: storeSettings.storeId,
				set: {
					orderTypes: input.orderTypes,
					updatedAt: new Date(),
				},
			})
			.returning();

		if (!upsertedSettings) {
			throw new ValidationError("Failed to save settings");
		}

		return {
			storeId: upsertedSettings.storeId,
			orderTypes: upsertedSettings.orderTypes ?? DEFAULT_ORDER_TYPES,
			createdAt: upsertedSettings.createdAt,
			updatedAt: upsertedSettings.updatedAt,
		};
	}
}
