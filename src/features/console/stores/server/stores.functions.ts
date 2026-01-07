"use server";

import slugify from "@sindresorhus/slugify";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { stores } from "@/db/schema.ts";
import { withAuth } from "@/features/console/auth/server/auth-middleware";
import { createStoreSchema, updateStoreSchema } from "../schemas.ts";

export const getStores = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { auth } = context;
		return db.query.stores.findMany({
			where: eq(stores.merchantId, auth.merchantId),
			orderBy: (stores, { asc }) => [asc(stores.name)],
		});
	});

export const getStoreCities = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.handler(async ({ context }) => {
		const { auth } = context;
		const merchantStores = await db.query.stores.findMany({
			where: eq(stores.merchantId, auth.merchantId),
			columns: { city: true },
		});
		const cities = [
			...new Set(merchantStores.map((s) => s.city).filter(Boolean)),
		];
		return cities.sort();
	});

export const getStore = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.inputValidator(z.object({ storeId: z.string().uuid() }))
	.handler(async ({ context, data }) => {
		const { auth } = context;
		const store = await db.query.stores.findFirst({
			where: and(
				eq(stores.id, data.storeId),
				eq(stores.merchantId, auth.merchantId),
			),
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
		const baseSlug = slugify(data.name);
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
	.inputValidator(updateStoreSchema.extend({ storeId: z.string().uuid() }))
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
	.inputValidator(
		z.object({ storeId: z.string().uuid(), isActive: z.boolean() }),
	)
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
	.inputValidator(z.object({ storeId: z.string().uuid() }))
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
			storeId: z.string().uuid(),
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
