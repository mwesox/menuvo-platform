/**
 * Store Service
 *
 * Service facade for store operations.
 */

import type { Database, Transaction } from "@menuvo/db";
import { stores } from "@menuvo/db/schema";
import slugify from "@sindresorhus/slugify";
import { and, asc, eq, gt, ilike, ne, or } from "drizzle-orm";
import { NotFoundError, ValidationError } from "../errors.js";
import type { IStoreService } from "./interface.js";
import type { IStoreStatusService } from "./status/index.js";
import type {
	CreateStoreInput,
	GetFeaturedStoresParams,
	SearchStoresParams,
	SearchStoresResult,
	SlugAvailabilityResult,
	StoreWithStatus,
	UpdateStoreInput,
} from "./types.js";
import { sortClosures, sortHours } from "./utils.js";

/**
 * Store service implementation
 */
export class StoreService implements IStoreService {
	private readonly db: Database;
	private readonly statusService: IStoreStatusService | null;

	constructor(db: Database, statusService?: IStoreStatusService) {
		this.db = db;
		this.statusService = statusService ?? null;
	}

	async list(merchantId: string): Promise<(typeof stores.$inferSelect)[]> {
		return this.db.query.stores.findMany({
			where: eq(stores.merchantId, merchantId),
			orderBy: (stores, { asc }) => [asc(stores.name)],
		});
	}

	async getById(
		storeId: string,
		merchantId: string,
	): Promise<typeof stores.$inferSelect> {
		const store = await this.db.query.stores.findFirst({
			where: and(eq(stores.id, storeId), eq(stores.merchantId, merchantId)),
		});

		if (!store) {
			throw new NotFoundError("Store not found");
		}

		return store;
	}

	async getWithDetails(storeId: string, merchantId: string) {
		const store = await this.db.query.stores.findFirst({
			where: and(eq(stores.id, storeId), eq(stores.merchantId, merchantId)),
			with: {
				settings: {
					columns: { hours: true, closures: true },
				},
			},
		});

		if (!store) {
			throw new NotFoundError("Store not found");
		}

		// Extract hours and closures from settings JSONB
		const hours = store.settings?.hours ?? [];
		const closures = store.settings?.closures ?? [];

		// Return store with sorted hours and closures at top level for compatibility
		const { settings: _, ...storeData } = store;
		return {
			...storeData,
			hours: sortHours(hours),
			closures: sortClosures(closures),
		};
	}

	async getBySlug(slug: string): Promise<typeof stores.$inferSelect> {
		const store = await this.db.query.stores.findFirst({
			where: and(eq(stores.slug, slug), eq(stores.isActive, true)),
		});

		if (!store) {
			throw new NotFoundError("Store not found");
		}

		return store;
	}

	async getCities(merchantId: string): Promise<string[]> {
		const merchantStores = await this.db.query.stores.findMany({
			where: eq(stores.merchantId, merchantId),
			columns: { city: true },
		});

		const cities = [
			...new Set(
				merchantStores
					.map((s) => s.city)
					.filter((city): city is string => Boolean(city)),
			),
		];

		return cities.sort();
	}

	async create(
		merchantId: string,
		input: CreateStoreInput,
		tx?: Transaction,
	): Promise<typeof stores.$inferSelect> {
		const db = tx ?? this.db;

		// Use provided slug or generate unique slug from store name
		const slug =
			input.slug ?? (await this.findUniqueSlug(this.generateSlug(input.name)));

		// Build insert values
		// Address, contact fields are now required (aligned with onboarding)
		// Timezone/currency/countryCode are optional - use defaults if not provided
		const insertValues: typeof stores.$inferInsert = {
			merchantId: merchantId,
			name: input.name,
			slug,
			// Address - required
			street: input.street,
			city: input.city,
			postalCode: input.postalCode,
			country: input.country,
			// Contact - required
			phone: input.phone,
			email: input.email,
			// Settings - optional with defaults
			...(input.timezone && { timezone: input.timezone }),
			...(input.currency && { currency: input.currency }),
			...(input.countryCode && { countryCode: input.countryCode }),
		};

		const [newStore] = await db.insert(stores).values(insertValues).returning();

		if (!newStore) {
			throw new ValidationError("Failed to create store");
		}

		return newStore;
	}

	async update(
		storeId: string,
		merchantId: string,
		input: UpdateStoreInput,
	): Promise<typeof stores.$inferSelect> {
		// Verify ownership
		const existingStore = await this.db.query.stores.findFirst({
			where: and(eq(stores.id, storeId), eq(stores.merchantId, merchantId)),
			columns: { id: true },
		});

		if (!existingStore) {
			throw new NotFoundError("Store not found");
		}

		// Build update object, only including defined fields
		// Note: Slug is permanent - it's set at creation and never changes
		const updateData: Record<string, unknown> = {};
		if (input.name !== undefined) updateData.name = input.name;
		if (input.street !== undefined) updateData.street = input.street;
		if (input.city !== undefined) updateData.city = input.city;
		if (input.postalCode !== undefined)
			updateData.postalCode = input.postalCode;
		if (input.country !== undefined) updateData.country = input.country;
		if (input.phone !== undefined) updateData.phone = input.phone;
		if (input.email !== undefined) updateData.email = input.email;
		if (input.timezone !== undefined) updateData.timezone = input.timezone;
		if (input.currency !== undefined) updateData.currency = input.currency;

		const [updatedStore] = await this.db
			.update(stores)
			.set(updateData)
			.where(eq(stores.id, storeId))
			.returning();

		if (!updatedStore) {
			throw new ValidationError("Failed to update store");
		}

		return updatedStore;
	}

	async delete(storeId: string, merchantId: string): Promise<void> {
		// Verify ownership
		const store = await this.db.query.stores.findFirst({
			where: and(eq(stores.id, storeId), eq(stores.merchantId, merchantId)),
			columns: { id: true },
		});

		if (!store) {
			throw new NotFoundError("Store not found");
		}

		await this.db.delete(stores).where(eq(stores.id, storeId));
	}

	async toggleActive(
		storeId: string,
		merchantId: string,
		isActive: boolean,
	): Promise<typeof stores.$inferSelect> {
		// Verify ownership
		const store = await this.db.query.stores.findFirst({
			where: and(eq(stores.id, storeId), eq(stores.merchantId, merchantId)),
			columns: { id: true },
		});

		if (!store) {
			throw new NotFoundError("Store not found");
		}

		const [updatedStore] = await this.db
			.update(stores)
			.set({ isActive })
			.where(eq(stores.id, storeId))
			.returning();

		if (!updatedStore) {
			throw new ValidationError("Failed to update store status");
		}

		return updatedStore;
	}

	async updateImage(
		storeId: string,
		merchantId: string,
		imageUrl: string | null,
	): Promise<typeof stores.$inferSelect> {
		// Verify ownership
		const store = await this.db.query.stores.findFirst({
			where: and(eq(stores.id, storeId), eq(stores.merchantId, merchantId)),
			columns: { id: true },
		});

		if (!store) {
			throw new NotFoundError("Store not found");
		}

		const [updatedStore] = await this.db
			.update(stores)
			.set({ logoUrl: imageUrl })
			.where(eq(stores.id, storeId))
			.returning();

		if (!updatedStore) {
			throw new ValidationError("Failed to update store image");
		}

		return updatedStore;
	}

	async checkSlugAvailability(
		name: string,
		excludeStoreId?: string,
	): Promise<{ slug: string } & SlugAvailabilityResult> {
		const slug = this.generateSlug(name);
		const result = await this.checkSlugAvailabilityInternal(
			slug,
			excludeStoreId,
		);
		return { slug, ...result };
	}

	async searchStores(params: SearchStoresParams): Promise<SearchStoresResult> {
		const { query, city, limit, cursor } = params;

		// Build where conditions
		const conditions = [eq(stores.isActive, true)];

		// Text search on name
		if (query) {
			conditions.push(
				or(
					ilike(stores.name, `%${query}%`),
					ilike(stores.city, `%${query}%`),
				) ?? eq(stores.isActive, true),
			);
		}

		// City filter
		if (city) {
			conditions.push(ilike(stores.city, `%${city}%`));
		}

		// Cursor-based pagination
		if (cursor) {
			conditions.push(gt(stores.id, cursor));
		}

		const results = await this.db.query.stores.findMany({
			where: and(...conditions),
			orderBy: [asc(stores.name)],
			limit: limit + 1, // Fetch one extra to check if there are more
			columns: {
				id: true,
				slug: true,
				name: true,
				logoUrl: true,
				street: true,
				city: true,
				postalCode: true,
				country: true,
				currency: true,
			},
		});

		// Check if there are more results
		const hasMore = results.length > limit;
		const storeResults = hasMore ? results.slice(0, -1) : results;
		const nextCursor = hasMore
			? storeResults[storeResults.length - 1]?.id
			: undefined;

		return {
			stores: storeResults,
			nextCursor,
		};
	}

	async getFeaturedStores(
		params: GetFeaturedStoresParams,
	): Promise<StoreWithStatus[]> {
		const { city, limit } = params;

		// Build where conditions
		const conditions = [eq(stores.isActive, true)];

		// City filter
		if (city) {
			conditions.push(ilike(stores.city, `%${city}%`));
		}

		// TODO: Add isFeatured column to stores table for explicit featuring
		// For now, return active stores ordered by creation date (newest first)
		const results = await this.db.query.stores.findMany({
			where: and(...conditions),
			orderBy: (stores, { desc }) => [desc(stores.createdAt)],
			limit,
			columns: {
				id: true,
				slug: true,
				name: true,
				logoUrl: true,
				street: true,
				city: true,
				postalCode: true,
				country: true,
				currency: true,
			},
		});

		// Add status to each store using status service if available
		if (this.statusService) {
			const storesWithStatus = await Promise.all(
				results.map(async (store) => {
					try {
						const status = await this.statusService?.getStatusBySlug(
							store.slug,
						);
						return {
							...store,
							status,
						};
					} catch {
						// If status can't be computed, return store without status
						return store;
					}
				}),
			);
			return storesWithStatus;
		}

		// If status service is not available, return stores without status
		return results;
	}

	// Private utility methods
	private generateSlug(name: string): string {
		return slugify(name);
	}

	private async findUniqueSlug(
		baseSlug: string,
		excludeStoreId?: string,
	): Promise<string> {
		let slug = baseSlug;
		let counter = 1;

		while (true) {
			const whereClause = excludeStoreId
				? and(eq(stores.slug, slug), ne(stores.id, excludeStoreId))
				: eq(stores.slug, slug);

			const existing = await this.db.query.stores.findFirst({
				where: whereClause,
				columns: { id: true },
			});

			if (!existing) break;
			slug = `${baseSlug}-${counter}`;
			counter++;
		}

		return slug;
	}

	private async checkSlugAvailabilityInternal(
		slug: string,
		excludeStoreId?: string,
	): Promise<SlugAvailabilityResult> {
		const whereClause = excludeStoreId
			? and(eq(stores.slug, slug), ne(stores.id, excludeStoreId))
			: eq(stores.slug, slug);

		const existing = await this.db.query.stores.findFirst({
			where: whereClause,
			columns: { id: true },
		});

		if (!existing) {
			return { available: true, suggestions: [] };
		}

		// Generate up to 3 available suggestions
		const suggestions: string[] = [];
		for (let i = 1; suggestions.length < 3 && i < 100; i++) {
			const candidate = `${slug}-${i}`;
			const candidateWhere = excludeStoreId
				? and(eq(stores.slug, candidate), ne(stores.id, excludeStoreId))
				: eq(stores.slug, candidate);

			const taken = await this.db.query.stores.findFirst({
				where: candidateWhere,
				columns: { id: true },
			});

			if (!taken) {
				suggestions.push(candidate);
			}
		}

		return { available: false, suggestions };
	}
}
