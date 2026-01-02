/**
 * Smoke tests for categories server functions.
 *
 * Tests basic CRUD operations for menu categories.
 * Uses unique IDs per test run to avoid conflicts.
 */

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { categories } from "@/db/schema";
import {
	cleanupTestData,
	closeTestDb,
	createTestCategory,
	createTestMerchant,
	createTestRunId,
	createTestStore,
	testDb,
} from "@/test/factories";
import {
	createCategory,
	deleteCategory,
	getCategories,
	getCategory,
	toggleCategoryActive,
	updateCategory,
} from "./categories.functions";

describe("categories.functions", () => {
	const testRunId = createTestRunId();
	let merchantId: number;
	let storeId: number;

	beforeAll(async () => {
		const merchant = await createTestMerchant({ testRunId });
		merchantId = merchant.id;

		const store = await createTestStore({ testRunId, merchantId });
		storeId = store.id;
	});

	afterAll(async () => {
		await cleanupTestData(testRunId);
		await closeTestDb();
	});

	describe("createCategory", () => {
		it("should create a category with translations", async () => {
			const result = await createCategory({
				data: {
					storeId,
					translations: {
						de: {
							name: `Vorspeisen ${testRunId}`,
							description: "Deutsche Beschreibung",
						},
						en: {
							name: `Starters ${testRunId}`,
							description: "English description",
						},
					},
				},
			});

			expect(result).toBeDefined();
			expect(result.id).toBeGreaterThan(0);
			expect(result.storeId).toBe(storeId);
			expect(result.translations.de?.name).toContain("Vorspeisen");
			expect(result.translations.en?.name).toContain("Starters");
		});

		it("should auto-compute displayOrder", async () => {
			const first = await createCategory({
				data: {
					storeId,
					translations: { de: { name: `First ${testRunId}` } },
				},
			});

			const second = await createCategory({
				data: {
					storeId,
					translations: { de: { name: `Second ${testRunId}` } },
				},
			});

			expect(second.displayOrder).toBeGreaterThan(first.displayOrder);
		});
	});

	describe("getCategory", () => {
		it("should return category by id with items", async () => {
			const created = await createTestCategory({ testRunId, storeId });

			const result = await getCategory({ data: { categoryId: created.id } });

			expect(result).toBeDefined();
			expect(result.id).toBe(created.id);
			expect(result.items).toBeDefined();
			expect(Array.isArray(result.items)).toBe(true);
		});

		it("should throw for non-existent category", async () => {
			await expect(
				getCategory({ data: { categoryId: 999999 } }),
			).rejects.toThrow("Category not found");
		});
	});

	describe("getCategories", () => {
		it("should return categories for store with items", async () => {
			// Create a category first
			await createTestCategory({ testRunId, storeId });

			const result = await getCategories({ data: { storeId } });

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
			// Should have items relation loaded
			expect(result[0].items).toBeDefined();
		});
	});

	describe("updateCategory", () => {
		it("should update category translations", async () => {
			const created = await createTestCategory({ testRunId, storeId });

			const result = await updateCategory({
				data: {
					categoryId: created.id,
					translations: {
						de: {
							name: `Updated ${testRunId}`,
							description: "Neue Beschreibung",
						},
					},
				},
			});

			expect(result.translations.de?.name).toContain("Updated");
			expect(result.translations.de?.description).toBe("Neue Beschreibung");
		});
	});

	describe("toggleCategoryActive", () => {
		it("should toggle category active status", async () => {
			const created = await createTestCategory({
				testRunId,
				storeId,
				isActive: true,
			});

			const result = await toggleCategoryActive({
				data: { categoryId: created.id, isActive: false },
			});

			expect(result.isActive).toBe(false);
		});
	});

	describe("deleteCategory", () => {
		it("should delete category", async () => {
			const created = await createTestCategory({ testRunId, storeId });

			const result = await deleteCategory({ data: { categoryId: created.id } });

			expect(result.success).toBe(true);

			// Verify deleted
			const deleted = await testDb.query.categories.findFirst({
				where: eq(categories.id, created.id),
			});
			expect(deleted).toBeUndefined();
		});
	});
});
