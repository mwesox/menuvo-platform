import { createServerFn } from "@tanstack/react-start";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { items } from "@/db/schema.ts";
import { createItemSchema, updateItemSchema } from "../schemas.ts";

// Sort by name extracted from translations JSONB (German as primary)
const itemNameSort = asc(sql`${items.translations}->'de'->>'name'`);

export const getItems = createServerFn({ method: "GET" })
	.inputValidator(z.object({ categoryId: z.number() }))
	.handler(async ({ data }) => {
		const allItems = await db.query.items.findMany({
			where: eq(items.categoryId, data.categoryId),
			orderBy: [asc(items.displayOrder), itemNameSort],
		});
		return allItems;
	});

export const getItemsByStore = createServerFn({ method: "GET" })
	.inputValidator(z.object({ storeId: z.number() }))
	.handler(async ({ data }) => {
		const allItems = await db.query.items.findMany({
			where: eq(items.storeId, data.storeId),
			orderBy: [asc(items.displayOrder), itemNameSort],
		});
		return allItems;
	});

export const getItem = createServerFn({ method: "GET" })
	.inputValidator(z.object({ itemId: z.number() }))
	.handler(async ({ data }) => {
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
	.inputValidator(createItemSchema)
	.handler(async ({ data }) => {
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
				imageUrl: data.imageUrl || null,
				kitchenName: data.kitchenName || null,
				displayOrder: data.displayOrder ?? maxOrder + 1,
			})
			.returning();

		return newItem;
	});

export const updateItem = createServerFn({ method: "POST" })
	.inputValidator(updateItemSchema.extend({ itemId: z.number() }))
	.handler(async ({ data }) => {
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
	.inputValidator(z.object({ itemId: z.number(), isAvailable: z.boolean() }))
	.handler(async ({ data }) => {
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
	.inputValidator(z.object({ itemId: z.number() }))
	.handler(async ({ data }) => {
		await db.delete(items).where(eq(items.id, data.itemId));
		return { success: true };
	});
