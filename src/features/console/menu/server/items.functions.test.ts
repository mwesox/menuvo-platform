/**
 * Smoke tests for items server functions.
 *
 * Tests basic CRUD operations for menu items.
 * Uses unique IDs per test run to avoid conflicts.
 */

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { items } from "@/db/schema";
import {
	cleanupTestData,
	closeTestDb,
	createTestCategory,
	createTestItem,
	createTestMerchant,
	createTestRunId,
	createTestStore,
	testDb,
} from "@/test/factories";
import {
	createItem,
	deleteItem,
	getItem,
	getItems,
	getItemsByStore,
	toggleItemAvailable,
	updateItem,
} from "./items.functions";

describe("items.functions", () => {
	const testRunId = createTestRunId();
	let merchantId: number;
	let storeId: number;
	let categoryId: number;

	beforeAll(async () => {
		const merchant = await createTestMerchant({ testRunId });
		merchantId = merchant.id;

		const store = await createTestStore({ testRunId, merchantId });
		storeId = store.id;

		const category = await createTestCategory({ testRunId, storeId });
		categoryId = category.id;
	});

	afterAll(async () => {
		await cleanupTestData(testRunId);
		await closeTestDb();
	});

	describe("createItem", () => {
		it("should create an item with translations and price", async () => {
			const result = await createItem({
				data: {
					categoryId,
					storeId,
					translations: {
						de: { name: `Burger ${testRunId}`, description: "Lecker" },
						en: { name: `Burger ${testRunId}`, description: "Delicious" },
					},
					price: 1299, // 12.99 EUR in cents
					allergens: ["gluten", "dairy"],
				},
			});

			expect(result).toBeDefined();
			expect(result.id).toBeGreaterThan(0);
			expect(result.categoryId).toBe(categoryId);
			expect(result.storeId).toBe(storeId);
			expect(result.price).toBe(1299);
			expect(result.translations.de?.name).toContain("Burger");
			expect(result.allergens).toContain("gluten");
		});

		it.skip("should auto-compute displayOrder within category", async () => {
			const first = await createItem({
				data: {
					categoryId,
					storeId,
					translations: { de: { name: `First Item ${testRunId}` } },
					price: 500,
				},
			});

			const second = await createItem({
				data: {
					categoryId,
					storeId,
					translations: { de: { name: `Second Item ${testRunId}` } },
					price: 600,
				},
			});

			expect(second.displayOrder).toBeGreaterThan(first.displayOrder);
		});
	});

	describe("getItem", () => {
		it("should return item by id with category", async () => {
			const created = await createTestItem({ testRunId, categoryId, storeId });

			const result = await getItem({ data: { itemId: created.id } });

			expect(result).toBeDefined();
			expect(result.id).toBe(created.id);
			expect(result.category).toBeDefined();
			expect(result.category.id).toBe(categoryId);
		});

		it("should throw for non-existent item", async () => {
			await expect(getItem({ data: { itemId: 999999 } })).rejects.toThrow(
				"Item not found",
			);
		});
	});

	describe("getItems", () => {
		it("should return items for category", async () => {
			// Create an item first
			await createTestItem({ testRunId, categoryId, storeId });

			const result = await getItems({ data: { categoryId } });

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
		});
	});

	describe("getItemsByStore", () => {
		it("should return all items for store", async () => {
			const result = await getItemsByStore({ data: { storeId } });

			expect(Array.isArray(result)).toBe(true);
		});
	});

	describe("updateItem", () => {
		it("should update item fields", async () => {
			const created = await createTestItem({
				testRunId,
				categoryId,
				storeId,
				price: 1000,
			});

			const result = await updateItem({
				data: {
					itemId: created.id,
					price: 1500,
					translations: {
						de: { name: `Updated Item ${testRunId}`, description: "Neu" },
					},
				},
			});

			expect(result.price).toBe(1500);
			expect(result.translations.de?.name).toContain("Updated");
		});
	});

	describe("toggleItemAvailable", () => {
		it("should toggle item availability", async () => {
			const created = await createTestItem({
				testRunId,
				categoryId,
				storeId,
				isAvailable: true,
			});

			const result = await toggleItemAvailable({
				data: { itemId: created.id, isAvailable: false },
			});

			expect(result.isAvailable).toBe(false);

			// Toggle back
			const result2 = await toggleItemAvailable({
				data: { itemId: created.id, isAvailable: true },
			});

			expect(result2.isAvailable).toBe(true);
		});
	});

	describe("deleteItem", () => {
		it("should delete item", async () => {
			const created = await createTestItem({ testRunId, categoryId, storeId });

			const result = await deleteItem({ data: { itemId: created.id } });

			expect(result.success).toBe(true);

			// Verify deleted
			const deleted = await testDb.query.items.findFirst({
				where: eq(items.id, created.id),
			});
			expect(deleted).toBeUndefined();
		});
	});
});
