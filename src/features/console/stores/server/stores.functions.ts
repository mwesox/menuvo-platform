import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { stores } from "@/db/schema.ts";
import { generateSlug } from "@/lib/slug";
import { createStoreSchema, updateStoreSchema } from "../validation.ts";

export const getStores = createServerFn({ method: "GET" }).handler(async () => {
	try {
		return await db.query.stores.findMany({
			orderBy: (stores, { asc }) => [asc(stores.name)],
		});
	} catch {
		// Return empty array if database is not available or tables don't exist
		return [];
	}
});

export const getStoreCities = createServerFn({ method: "GET" }).handler(
	async () => {
		try {
			const allStores = await db.query.stores.findMany({
				columns: { city: true },
			});
			const cities = [...new Set(allStores.map((s) => s.city).filter(Boolean))];
			return cities.sort();
		} catch {
			// Return empty array if database is not available or tables don't exist
			return [];
		}
	},
);

export const getStore = createServerFn({ method: "GET" })
	.inputValidator(z.object({ storeId: z.number() }))
	.handler(async ({ data }) => {
		const store = await db.query.stores.findFirst({
			where: eq(stores.id, data.storeId),
		});
		if (!store) {
			throw new Error("Store not found");
		}
		return store;
	});

export const createStore = createServerFn({ method: "POST" })
	.inputValidator(createStoreSchema)
	.handler(async ({ data }) => {
		// Generate unique slug
		const baseSlug = generateSlug(data.name);
		let slug = baseSlug;
		let counter = 1;

		while (true) {
			const existing = await db.query.stores.findFirst({
				where: eq(stores.slug, slug),
			});
			if (!existing) break;
			slug = `${baseSlug}-${counter}`;
			counter++;
		}

		const [newStore] = await db
			.insert(stores)
			.values({
				...data,
				slug,
				email: data.email || null,
			})
			.returning();

		return newStore;
	});

export const updateStore = createServerFn({ method: "POST" })
	.inputValidator(updateStoreSchema.extend({ storeId: z.number() }))
	.handler(async ({ data }) => {
		const { storeId, ...updates } = data;

		const [updatedStore] = await db
			.update(stores)
			.set({
				...updates,
				email: updates.email || null,
			})
			.where(eq(stores.id, storeId))
			.returning();

		if (!updatedStore) {
			throw new Error("Store not found");
		}

		return updatedStore;
	});

export const toggleStoreActive = createServerFn({ method: "POST" })
	.inputValidator(z.object({ storeId: z.number(), isActive: z.boolean() }))
	.handler(async ({ data }) => {
		const [updatedStore] = await db
			.update(stores)
			.set({ isActive: data.isActive })
			.where(eq(stores.id, data.storeId))
			.returning();

		if (!updatedStore) {
			throw new Error("Store not found");
		}

		return updatedStore;
	});

export const deleteStore = createServerFn({ method: "POST" })
	.inputValidator(z.object({ storeId: z.number() }))
	.handler(async ({ data }) => {
		await db.delete(stores).where(eq(stores.id, data.storeId));
		return { success: true };
	});

/**
 * Update a store's logo image URL.
 */
export const updateStoreImage = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			storeId: z.number(),
			imageUrl: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		const { storeId, imageUrl } = data;

		const [updatedStore] = await db
			.update(stores)
			.set({ logoUrl: imageUrl ?? null })
			.where(eq(stores.id, storeId))
			.returning();

		if (!updatedStore) {
			throw new Error("Store not found");
		}

		return updatedStore;
	});
