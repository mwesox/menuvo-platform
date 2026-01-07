"use server";

import { createServerFn } from "@tanstack/react-start";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, items } from "@/db/schema.ts";
import { withAuth } from "../../auth/server/auth-middleware.ts";
import { requireStoreOwnership } from "../../auth/server/ownership.ts";
import { createItemSchema, updateItemSchema } from "../schemas.ts";

// Sort by name extracted from translations JSONB (German as primary)
const itemNameSort = asc(sql`${items.translations}->'de'->>'name'`);

// Helper to validate item ownership (for functions that take itemId)
async function requireItemOwnership(itemId: string, merchantId: string) {
	const item = await db.query.items.findFirst({
		where: eq(items.id, itemId),
		with: { store: { columns: { merchantId: true } } },
	});
	if (!item || item.store.merchantId !== merchantId) {
		throw new Error("Item not found or access denied");
	}
	return item;
}

export const getItems = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.inputValidator(z.object({ categoryId: z.string().uuid() }))
	.handler(async ({ context, data }) => {
		// Validate category belongs to merchant
		const category = await db.query.categories.findFirst({
			where: eq(categories.id, data.categoryId),
			with: { store: { columns: { merchantId: true } } },
		});
		if (!category || category.store.merchantId !== context.auth.merchantId) {
			throw new Error("Category not found or access denied");
		}

		const allItems = await db.query.items.findMany({
			where: eq(items.categoryId, data.categoryId),
			orderBy: [asc(items.displayOrder), itemNameSort],
		});
		return allItems;
	});

export const getItemsByStore = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.inputValidator(z.object({ storeId: z.string().uuid() }))
	.handler(async ({ context, data }) => {
		const store = await requireStoreOwnership(
			data.storeId,
			context.auth.merchantId,
		);
		const allItems = await db.query.items.findMany({
			where: eq(items.storeId, store.id),
			orderBy: [asc(items.displayOrder), itemNameSort],
		});
		return allItems;
	});

export const getItem = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.inputValidator(z.object({ itemId: z.string().uuid() }))
	.handler(async ({ context, data }) => {
		await requireItemOwnership(data.itemId, context.auth.merchantId);

		const item = await db.query.items.findFirst({
			where: eq(items.id, data.itemId),
			with: {
				category: true,
			},
		});
		if (!item) {
			throw new Error("Item not found");
		}
		return item;
	});

export const createItem = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(createItemSchema)
	.handler(async ({ context, data }) => {
		const store = await requireStoreOwnership(
			data.storeId,
			context.auth.merchantId,
		);

		// Get max display order
		const existing = await db.query.items.findMany({
			where: eq(items.categoryId, data.categoryId),
			orderBy: (items, { desc }) => [desc(items.displayOrder)],
			limit: 1,
		});
		const maxOrder = existing[0]?.displayOrder ?? -1;

		const [newItem] = await db
			.insert(items)
			.values({
				...data,
				storeId: store.id, // Use validated store
				imageUrl: data.imageUrl || null,
				kitchenName: data.kitchenName || null,
				displayOrder: data.displayOrder ?? maxOrder + 1,
			})
			.returning();

		return newItem;
	});

export const updateItem = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(updateItemSchema.extend({ itemId: z.string().uuid() }))
	.handler(async ({ context, data }) => {
		await requireItemOwnership(data.itemId, context.auth.merchantId);

		const { itemId, ...updates } = data;

		const [updatedItem] = await db
			.update(items)
			.set({
				...updates,
				imageUrl: updates.imageUrl || null,
				kitchenName: updates.kitchenName || null,
			})
			.where(eq(items.id, itemId))
			.returning();

		if (!updatedItem) {
			throw new Error("Item not found");
		}

		return updatedItem;
	});

export const toggleItemAvailable = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(
		z.object({ itemId: z.string().uuid(), isAvailable: z.boolean() }),
	)
	.handler(async ({ context, data }) => {
		await requireItemOwnership(data.itemId, context.auth.merchantId);

		const [updatedItem] = await db
			.update(items)
			.set({ isAvailable: data.isAvailable })
			.where(eq(items.id, data.itemId))
			.returning();

		if (!updatedItem) {
			throw new Error("Item not found");
		}

		return updatedItem;
	});

export const deleteItem = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(z.object({ itemId: z.string().uuid() }))
	.handler(async ({ context, data }) => {
		await requireItemOwnership(data.itemId, context.auth.merchantId);

		await db.delete(items).where(eq(items.id, data.itemId));
		return { success: true };
	});
