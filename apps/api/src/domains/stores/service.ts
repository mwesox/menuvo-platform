/**
 * Store Service
 *
 * Service facade for store operations.
 */

import type { Database } from "@menuvo/db";
import { stores } from "@menuvo/db/schema";
import slugify from "@sindresorhus/slugify";
import { and, eq, ne } from "drizzle-orm";
import { NotFoundError, ValidationError } from "../errors.js";
import type { IStoreService } from "./interface.js";
import type {
	CreateStoreInput,
	SlugAvailabilityResult,
	UpdateStoreInput,
} from "./types.js";

/**
 * Store service implementation
 */
export class StoreService implements IStoreService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
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
				hours: {
					orderBy: (h, { asc }) => [asc(h.dayOfWeek), asc(h.displayOrder)],
				},
				closures: {
					orderBy: (c, { asc }) => [asc(c.startDate)],
				},
			},
		});

		if (!store) {
			throw new NotFoundError("Store not found");
		}

		return store;
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
	): Promise<typeof stores.$inferSelect> {
		// Generate unique slug from store name
		const baseSlug = this.generateSlug(input.name);
		const slug = await this.findUniqueSlug(baseSlug);

		const [newStore] = await this.db
			.insert(stores)
			.values({
				merchantId: merchantId,
				name: input.name,
				slug,
				street: input.street ?? null,
				city: input.city ?? null,
				postalCode: input.postalCode ?? null,
				country: input.country ?? null,
				phone: input.phone,
				email: input.email ?? null,
				timezone: input.timezone ?? null,
				currency: input.currency ?? null,
			} as typeof stores.$inferInsert)
			.returning();

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
