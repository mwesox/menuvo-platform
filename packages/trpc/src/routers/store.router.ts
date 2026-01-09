/**
 * Store Router
 *
 * Handles store-related procedures:
 * - Store CRUD operations
 * - Store settings
 * - Store configuration
 */

import { stores } from "@menuvo/db/schema";
import slugify from "@sindresorhus/slugify";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import {
	createStoreApiSchema,
	deleteStoreApiSchema,
	getStoreByIdApiSchema,
	getStoreBySlugApiSchema,
	toggleStoreActiveApiSchema,
	updateStoreApiSchema,
	updateStoreImageApiSchema,
} from "../schemas/store.schema.js";
import { protectedProcedure, publicProcedure, router } from "../trpc.js";

// ============================================================================
// STORE ROUTER
// ============================================================================

export const storeRouter = router({
	/**
	 * List all stores for the authenticated merchant
	 */
	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.query.stores.findMany({
			where: eq(stores.merchantId, ctx.session.merchantId),
			orderBy: (stores, { asc }) => [asc(stores.name)],
		});
	}),

	/**
	 * Get store by ID (with ownership check)
	 */
	getById: protectedProcedure
		.input(getStoreByIdApiSchema)
		.query(async ({ ctx, input }) => {
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, input.storeId),
					eq(stores.merchantId, ctx.session.merchantId),
				),
			});

			if (!store) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found",
				});
			}

			return store;
		}),

	/**
	 * Get store with hours and closures (for store detail page)
	 * Returns all data needed for the store detail view in one query
	 */
	getWithDetails: protectedProcedure
		.input(getStoreByIdApiSchema)
		.query(async ({ ctx, input }) => {
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, input.storeId),
					eq(stores.merchantId, ctx.session.merchantId),
				),
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
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found",
				});
			}

			return store;
		}),

	/**
	 * Get store by slug (public - for shop storefront)
	 */
	getBySlug: publicProcedure
		.input(getStoreBySlugApiSchema)
		.query(async ({ ctx, input }) => {
			const store = await ctx.db.query.stores.findFirst({
				where: and(eq(stores.slug, input.slug), eq(stores.isActive, true)),
			});

			if (!store) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found",
				});
			}

			return store;
		}),

	/**
	 * Get unique cities where merchant has stores
	 */
	getCities: protectedProcedure.query(async ({ ctx }) => {
		const merchantStores = await ctx.db.query.stores.findMany({
			where: eq(stores.merchantId, ctx.session.merchantId),
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
	}),

	/**
	 * Create a new store
	 */
	create: protectedProcedure
		.input(createStoreApiSchema)
		.mutation(async ({ ctx, input }) => {
			// Generate unique slug from store name
			const baseSlug = slugify(input.name);
			let slug = baseSlug;
			let counter = 1;

			// Ensure slug uniqueness
			while (true) {
				const existing = await ctx.db.query.stores.findFirst({
					where: eq(stores.slug, slug),
					columns: { id: true },
				});
				if (!existing) break;
				slug = `${baseSlug}-${counter}`;
				counter++;
			}

			const [newStore] = await ctx.db
				.insert(stores)
				.values({
					merchantId: ctx.session.merchantId,
					name: input.name,
					slug,
					street: input.street,
					city: input.city,
					postalCode: input.postalCode,
					country: input.country,
					phone: input.phone,
					email: input.email ?? null,
					timezone: input.timezone,
					currency: input.currency,
				})
				.returning();

			if (!newStore) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create store",
				});
			}

			return newStore;
		}),

	/**
	 * Update store details
	 */
	update: protectedProcedure
		.input(updateStoreApiSchema)
		.mutation(async ({ ctx, input }) => {
			const { storeId, ...updates } = input;

			// Verify ownership
			const existingStore = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, storeId),
					eq(stores.merchantId, ctx.session.merchantId),
				),
				columns: { id: true },
			});

			if (!existingStore) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found",
				});
			}

			// Build update object, only including defined fields
			const updateData: Record<string, unknown> = {};
			if (updates.name !== undefined) updateData.name = updates.name;
			if (updates.street !== undefined) updateData.street = updates.street;
			if (updates.city !== undefined) updateData.city = updates.city;
			if (updates.postalCode !== undefined)
				updateData.postalCode = updates.postalCode;
			if (updates.country !== undefined) updateData.country = updates.country;
			if (updates.phone !== undefined) updateData.phone = updates.phone;
			if (updates.email !== undefined) updateData.email = updates.email;
			if (updates.timezone !== undefined)
				updateData.timezone = updates.timezone;
			if (updates.currency !== undefined)
				updateData.currency = updates.currency;

			const [updatedStore] = await ctx.db
				.update(stores)
				.set(updateData)
				.where(eq(stores.id, storeId))
				.returning();

			if (!updatedStore) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update store",
				});
			}

			return updatedStore;
		}),

	/**
	 * Delete a store
	 */
	delete: protectedProcedure
		.input(deleteStoreApiSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify ownership
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, input.storeId),
					eq(stores.merchantId, ctx.session.merchantId),
				),
				columns: { id: true },
			});

			if (!store) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found",
				});
			}

			await ctx.db.delete(stores).where(eq(stores.id, input.storeId));

			return { success: true };
		}),

	/**
	 * Toggle store active status
	 */
	toggleActive: protectedProcedure
		.input(toggleStoreActiveApiSchema)
		.mutation(async ({ ctx, input }) => {
			// Verify ownership
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, input.storeId),
					eq(stores.merchantId, ctx.session.merchantId),
				),
				columns: { id: true },
			});

			if (!store) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found",
				});
			}

			const [updatedStore] = await ctx.db
				.update(stores)
				.set({ isActive: input.isActive })
				.where(eq(stores.id, input.storeId))
				.returning();

			if (!updatedStore) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update store status",
				});
			}

			return updatedStore;
		}),

	/**
	 * Update store logo image URL
	 */
	updateImage: protectedProcedure
		.input(updateStoreImageApiSchema)
		.mutation(async ({ ctx, input }) => {
			const { storeId, imageUrl } = input;

			// Verify ownership
			const store = await ctx.db.query.stores.findFirst({
				where: and(
					eq(stores.id, storeId),
					eq(stores.merchantId, ctx.session.merchantId),
				),
				columns: { id: true },
			});

			if (!store) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Store not found",
				});
			}

			const [updatedStore] = await ctx.db
				.update(stores)
				.set({ logoUrl: imageUrl ?? null })
				.where(eq(stores.id, storeId))
				.returning();

			if (!updatedStore) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update store image",
				});
			}

			return updatedStore;
		}),
});
