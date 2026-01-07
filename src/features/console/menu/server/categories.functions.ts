"use server";

import { createServerFn } from "@tanstack/react-start";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories } from "@/db/schema.ts";
import { withAuth } from "../../auth/server/auth-middleware.ts";
import { requireStoreOwnership } from "../../auth/server/ownership.ts";
import { createCategorySchema, updateCategorySchema } from "../schemas.ts";

// Sort by name extracted from translations JSONB (German as primary)
const categoryNameSort = asc(sql`${categories.translations}->'de'->>'name'`);

// Helper to validate category ownership (for functions that take categoryId)
async function requireCategoryOwnership(
	categoryId: string,
	merchantId: string,
) {
	const category = await db.query.categories.findFirst({
		where: eq(categories.id, categoryId),
		with: { store: { columns: { merchantId: true } } },
	});
	if (!category || category.store.merchantId !== merchantId) {
		throw new Error("Category not found or access denied");
	}
	return category;
}

export const getCategories = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.inputValidator(z.object({ storeId: z.string().uuid() }))
	.handler(async ({ context, data }) => {
		const store = await requireStoreOwnership(
			data.storeId,
			context.auth.merchantId,
		);
		const allCategories = await db.query.categories.findMany({
			where: eq(categories.storeId, store.id),
			orderBy: [asc(categories.displayOrder), categoryNameSort],
			with: {
				items: {
					orderBy: (items, { asc, sql }) => [
						asc(items.displayOrder),
						asc(sql`${items.translations}->'de'->>'name'`),
					],
				},
			},
		});
		return allCategories;
	});

export const getCategory = createServerFn({ method: "GET" })
	.middleware([withAuth])
	.inputValidator(z.object({ categoryId: z.string().uuid() }))
	.handler(async ({ context, data }) => {
		await requireCategoryOwnership(data.categoryId, context.auth.merchantId);

		const category = await db.query.categories.findFirst({
			where: eq(categories.id, data.categoryId),
			with: {
				items: {
					orderBy: (items, { asc, sql }) => [
						asc(items.displayOrder),
						asc(sql`${items.translations}->'de'->>'name'`),
					],
				},
			},
		});
		if (!category) {
			throw new Error("Category not found");
		}
		return category;
	});

export const createCategory = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(createCategorySchema)
	.handler(async ({ context, data }) => {
		const store = await requireStoreOwnership(
			data.storeId,
			context.auth.merchantId,
		);

		// Get max display order
		const existing = await db.query.categories.findMany({
			where: eq(categories.storeId, store.id),
			orderBy: (categories, { desc }) => [desc(categories.displayOrder)],
			limit: 1,
		});
		const maxOrder = existing[0]?.displayOrder ?? -1;

		const [newCategory] = await db
			.insert(categories)
			.values({
				...data,
				storeId: store.id, // Use validated store
				displayOrder: data.displayOrder ?? maxOrder + 1,
			})
			.returning();

		return newCategory;
	});

export const updateCategory = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(
		updateCategorySchema.extend({ categoryId: z.string().uuid() }),
	)
	.handler(async ({ context, data }) => {
		await requireCategoryOwnership(data.categoryId, context.auth.merchantId);

		const { categoryId, ...updates } = data;

		const [updatedCategory] = await db
			.update(categories)
			.set(updates)
			.where(eq(categories.id, categoryId))
			.returning();

		if (!updatedCategory) {
			throw new Error("Category not found");
		}

		return updatedCategory;
	});

export const toggleCategoryActive = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(
		z.object({ categoryId: z.string().uuid(), isActive: z.boolean() }),
	)
	.handler(async ({ context, data }) => {
		await requireCategoryOwnership(data.categoryId, context.auth.merchantId);

		const [updatedCategory] = await db
			.update(categories)
			.set({ isActive: data.isActive })
			.where(eq(categories.id, data.categoryId))
			.returning();

		if (!updatedCategory) {
			throw new Error("Category not found");
		}

		return updatedCategory;
	});

export const deleteCategory = createServerFn({ method: "POST" })
	.middleware([withAuth])
	.inputValidator(z.object({ categoryId: z.string().uuid() }))
	.handler(async ({ context, data }) => {
		await requireCategoryOwnership(data.categoryId, context.auth.merchantId);

		await db.delete(categories).where(eq(categories.id, data.categoryId));
		return { success: true };
	});
