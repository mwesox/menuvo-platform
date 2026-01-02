/**
 * Smoke tests for service points server functions.
 *
 * Tests basic CRUD operations for service points,
 * including batch creation and zone toggling.
 */

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { servicePoints } from "@/db/schema";
import {
	cleanupTestData,
	closeTestDb,
	createTestMerchant,
	createTestRunId,
	createTestServicePoint,
	createTestStore,
	testDb,
} from "@/test/factories";
import {
	batchCreateServicePoints,
	createServicePoint,
	deleteServicePoint,
	getServicePoint,
	getServicePoints,
	getServicePointZones,
	toggleServicePointActive,
	toggleZoneActive,
	updateServicePoint,
} from "./service-points.functions";

describe("service-points.functions", () => {
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

	describe("createServicePoint", () => {
		it("should create a service point", async () => {
			// Use a simple numeric code (testRunId contains underscores)
			const code = `sp-create-${Date.now()}`;
			const result = await createServicePoint({
				data: {
					storeId,
					code,
					name: "Test Table",
					zone: "Indoor",
				},
			});

			expect(result).toBeDefined();
			expect(result.id).toBeGreaterThan(0);
			expect(result.name).toBe("Test Table");
			expect(result.code).toBe(code);
			expect(result.zone).toBe("Indoor");
			expect(result.isActive).toBe(true);
		});

		it("should reject duplicate code within store", async () => {
			const code = `sp-dup-${Date.now()}`;

			await createServicePoint({
				data: { storeId, code, name: "First" },
			});

			await expect(
				createServicePoint({
					data: { storeId, code, name: "Second" },
				}),
			).rejects.toThrow("already exists");
		});
	});

	describe("getServicePoint", () => {
		it("should return service point by id", async () => {
			const created = await createTestServicePoint({ testRunId, storeId });

			const result = await getServicePoint({ data: { id: created.id } });

			expect(result).toBeDefined();
			expect(result.id).toBe(created.id);
			expect(result.name).toBe(created.name);
		});

		it("should throw for non-existent service point", async () => {
			await expect(getServicePoint({ data: { id: 999999 } })).rejects.toThrow(
				"not found",
			);
		});
	});

	describe("getServicePoints", () => {
		it("should return list of service points for store", async () => {
			await createTestServicePoint({ testRunId, storeId, name: "List Test 1" });
			await createTestServicePoint({ testRunId, storeId, name: "List Test 2" });

			const result = await getServicePoints({ data: { storeId } });

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe("updateServicePoint", () => {
		it("should update service point fields", async () => {
			const created = await createTestServicePoint({ testRunId, storeId });

			const result = await updateServicePoint({
				data: {
					id: created.id,
					name: "Updated Name",
					zone: "VIP",
				},
			});

			expect(result.name).toBe("Updated Name");
			expect(result.zone).toBe("VIP");
			expect(result.code).toBe(created.code); // Unchanged
		});
	});

	describe("toggleServicePointActive", () => {
		it("should toggle active status", async () => {
			const created = await createTestServicePoint({
				testRunId,
				storeId,
				isActive: true,
			});

			const result = await toggleServicePointActive({
				data: { id: created.id, isActive: false },
			});

			expect(result.isActive).toBe(false);

			const result2 = await toggleServicePointActive({
				data: { id: created.id, isActive: true },
			});

			expect(result2.isActive).toBe(true);
		});
	});

	describe("deleteServicePoint", () => {
		it("should delete service point", async () => {
			const created = await createTestServicePoint({ testRunId, storeId });

			const result = await deleteServicePoint({ data: { id: created.id } });

			expect(result.success).toBe(true);

			const deleted = await testDb.query.servicePoints.findFirst({
				where: eq(servicePoints.id, created.id),
			});
			expect(deleted).toBeUndefined();
		});
	});

	describe("getServicePointZones", () => {
		it("should return distinct zones", async () => {
			await createTestServicePoint({
				testRunId,
				storeId,
				zone: `Zone-A-${testRunId}`,
			});
			await createTestServicePoint({
				testRunId,
				storeId,
				zone: `Zone-B-${testRunId}`,
			});
			await createTestServicePoint({
				testRunId,
				storeId,
				zone: `Zone-A-${testRunId}`,
			}); // Duplicate

			const result = await getServicePointZones({ data: { storeId } });

			expect(Array.isArray(result)).toBe(true);
			expect(result).toContain(`Zone-A-${testRunId}`);
			expect(result).toContain(`Zone-B-${testRunId}`);
			// Should not have duplicates
			const zoneACount = result.filter(
				(z) => z === `Zone-A-${testRunId}`,
			).length;
			expect(zoneACount).toBe(1);
		});
	});

	describe("batchCreateServicePoints", () => {
		it("should create multiple service points", async () => {
			const result = await batchCreateServicePoints({
				data: {
					storeId,
					prefix: `BatchTable-${testRunId}`,
					startNumber: 1,
					endNumber: 5,
					zone: "Batch Zone",
				},
			});

			expect(result).toHaveLength(5);
			expect(result[0].name).toBe(`BatchTable-${testRunId} 1`);
			expect(result[0].code).toBe(`batchtable-${testRunId}-1`);
			expect(result[0].zone).toBe("Batch Zone");
			expect(result[4].name).toBe(`BatchTable-${testRunId} 5`);
		});

		it("should reject if codes already exist", async () => {
			const prefix = `ExistingBatch-${testRunId}`;

			// Create first batch
			await batchCreateServicePoints({
				data: {
					storeId,
					prefix,
					startNumber: 1,
					endNumber: 3,
				},
			});

			// Try to create overlapping batch
			await expect(
				batchCreateServicePoints({
					data: {
						storeId,
						prefix,
						startNumber: 2,
						endNumber: 5,
					},
				}),
			).rejects.toThrow("already exist");
		});
	});

	describe("toggleZoneActive", () => {
		it("should toggle all service points in a zone", async () => {
			const zoneName = `ToggleZone-${testRunId}`;

			await createTestServicePoint({
				testRunId,
				storeId,
				zone: zoneName,
				isActive: true,
			});
			await createTestServicePoint({
				testRunId,
				storeId,
				zone: zoneName,
				isActive: true,
			});
			await createTestServicePoint({
				testRunId,
				storeId,
				zone: "Other Zone",
				isActive: true,
			});

			const result = await toggleZoneActive({
				data: { storeId, zone: zoneName, isActive: false },
			});

			expect(result.count).toBe(2);
			expect(result.isActive).toBe(false);

			// Verify the zone points are inactive
			const points = await testDb.query.servicePoints.findMany({
				where: eq(servicePoints.zone, zoneName),
			});
			expect(points.every((p) => p.isActive === false)).toBe(true);
		});
	});
});
