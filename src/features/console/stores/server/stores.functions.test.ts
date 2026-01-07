/**
 * Smoke tests for stores server functions.
 *
 * Tests basic CRUD operations for stores.
 * Uses unique IDs per test run to avoid conflicts.
 */

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { stores } from "@/db/schema";
import {
	cleanupTestData,
	closeTestDb,
	createTestMerchant,
	createTestRunId,
	createTestStore,
	testDb,
} from "@/test/factories";
import { clearTestAuth, setTestAuth } from "@/test/setup";
import {
	createStore,
	deleteStore,
	getStore,
	getStores,
	toggleStoreActive,
	updateStore,
} from "./stores.functions";

describe("stores.functions", () => {
	const testRunId = createTestRunId();
	let merchantId: string;

	beforeAll(async () => {
		// Create test merchant for all tests in this file
		const merchant = await createTestMerchant({ testRunId });
		merchantId = merchant.id;

		// Set test auth to authenticate as this merchant
		setTestAuth({
			merchantId,
			merchant: { id: merchantId, name: merchant.name },
		});
	});

	afterAll(async () => {
		// Clean up test auth and data
		clearTestAuth();
		await cleanupTestData(testRunId);
		await closeTestDb();
	});

	describe("createStore", () => {
		it("should create a store with generated slug", async () => {
			const storeName = `Coffee Shop ${testRunId}`;

			const result = await createStore({
				data: {
					merchantId,
					name: storeName,
					street: "123 Main St",
					city: "Berlin",
					postalCode: "10115",
					country: "DE",
				},
			});

			expect(result).toBeDefined();
			expect(result.id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
			);
			expect(result.name).toBe(storeName);
			expect(result.slug).toContain("coffee-shop");
			expect(result.merchantId).toBe(merchantId);
			expect(result.city).toBe("Berlin");
		});

		it("should generate unique slug for duplicate names", async () => {
			const name = `Duplicate Store ${testRunId}`;

			const first = await createStore({
				data: {
					merchantId,
					name,
					street: "A",
					city: "B",
					postalCode: "1",
					country: "DE",
				},
			});

			const second = await createStore({
				data: {
					merchantId,
					name,
					street: "A",
					city: "B",
					postalCode: "1",
					country: "DE",
				},
			});

			expect(first.slug).not.toBe(second.slug);
			expect(second.slug).toMatch(/-\d+$/);
		});
	});

	describe("getStore", () => {
		it("should return store by id", async () => {
			const created = await createTestStore({ testRunId, merchantId });

			const result = await getStore({ data: { storeId: created.id } });

			expect(result).toBeDefined();
			expect(result.id).toBe(created.id);
			expect(result.name).toBe(created.name);
		});

		it("should throw for non-existent store", async () => {
			await expect(
				getStore({
					data: { storeId: "00000000-0000-0000-0000-000000000000" },
				}),
			).rejects.toThrow("Store not found");
		});
	});

	describe("getStores", () => {
		it("should return list of stores", async () => {
			const result = await getStores();

			expect(Array.isArray(result)).toBe(true);
			// Should contain at least the stores we created
		});
	});

	describe("updateStore", () => {
		it("should update store fields", async () => {
			const created = await createTestStore({ testRunId, merchantId });
			const newName = `Updated Store ${testRunId}`;

			const result = await updateStore({
				data: {
					storeId: created.id,
					name: newName,
					city: "Munich",
				},
			});

			expect(result.name).toBe(newName);
			expect(result.city).toBe("Munich");
			expect(result.street).toBe(created.street); // Unchanged
		});
	});

	describe("toggleStoreActive", () => {
		it("should toggle store active status", async () => {
			const created = await createTestStore({
				testRunId,
				merchantId,
				isActive: true,
			});

			const result = await toggleStoreActive({
				data: { storeId: created.id, isActive: false },
			});

			expect(result.isActive).toBe(false);

			// Toggle back
			const result2 = await toggleStoreActive({
				data: { storeId: created.id, isActive: true },
			});

			expect(result2.isActive).toBe(true);
		});
	});

	describe("deleteStore", () => {
		it("should delete store", async () => {
			const created = await createTestStore({ testRunId, merchantId });

			const result = await deleteStore({ data: { storeId: created.id } });

			expect(result.success).toBe(true);

			// Verify deleted
			const deleted = await testDb.query.stores.findFirst({
				where: eq(stores.id, created.id),
			});
			expect(deleted).toBeUndefined();
		});
	});
});
