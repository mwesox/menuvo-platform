import { createServerFn } from "@tanstack/react-start";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories } from "@/db/schema.ts";
import { createCategorySchema, updateCategorySchema } from "../schemas.ts";

// Sort by name extracted from translations JSONB (German as primary)
const categoryNameSort = asc(sql`${categories.translations}->'de'->>'name'`);

export const getCategories = createServerFn({ method: "GET" })
	.inputValidator(z.object({ storeId: z.number() }))
	.handler(async ({ data }) => {
		const allCategories = await db.query.categories.findMany({
			where: eq(categories.storeId, data.storeId),
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
	.inputValidator(z.object({ categoryId: z.number() }))
	.handler(async ({ data }) => {
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
	.inputValidator(createCategorySchema)
	.handler(async ({ data }) => {
		// Get max display order
		const existing = await db.query.categories.findMany({
			where: eq(categories.storeId, data.storeId),
			orderBy: (categories, { desc }) => [desc(categories.displayOrder)],
			limit: 1,
		});
		const maxOrder = existing[0]?.displayOrder ?? -1;

		const [newCategory] = await db
			.insert(categories)
			.values({
				...data,
				displayOrder: data.displayOrder ?? maxOrder + 1,
			})
			.returning();

		return newCategory;
	});

export const updateCategory = createServerFn({ method: "POST" })
	.inputValidator(updateCategorySchema.extend({ categoryId: z.number() }))
	.handler(async ({ data }) => {
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
	.inputValidator(z.object({ categoryId: z.number(), isActive: z.boolean() }))
	.handler(async ({ data }) => {
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
	.inputValidator(z.object({ categoryId: z.number() }))
	.handler(async ({ data }) => {
		await db.delete(categories).where(eq(categories.id, data.categoryId));
		return { success: true };
	});
