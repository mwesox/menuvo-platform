/**
 * High-level integration tests for the menu import pipeline.
 *
 * Tests the complete flow: File → Extract Text → AI Parse → Compare → Apply to DB
 * using dependency injection for testability.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { categories, items, menuImportJobs } from "@/db/schema";
import {
	applyImportChanges,
	getImportJobStatus,
} from "@/features/console/menu-import/server/import.functions";
import {
	type ProcessorDeps,
	processMenuImportJob,
} from "@/features/console/menu-import/server/processor";
import type { ExtractedMenuData } from "@/features/console/menu-import/types";
import {
	cleanupTestData,
	closeTestDb,
	createTestCategory,
	createTestImportJob,
	createTestItem,
	createTestMerchant,
	createTestRunId,
	createTestStore,
	testDb,
} from "@/test/factories";

// Type for the import job status response
type ImportJobStatus = {
	status: string;
	comparisonData: {
		summary: {
			totalCategories: number;
			totalItems: number;
			newCategories: number;
			newItems: number;
		};
		categories: Array<{
			extracted: { name: string };
			existingId?: string;
			items: Array<{
				extracted: { name: string };
				action: string;
				changes?: Array<{ field: string }>;
			}>;
		}>;
	};
};

// Load test fixtures
const FIXTURES_PATH = join(__dirname, "../../../fixtures/menu-import");

function loadFixture(filename: string): Buffer {
	return readFileSync(join(FIXTURES_PATH, filename));
}

/**
 * Creates a fake AI extraction result for testing.
 */
function createFakeExtraction(menu: {
	categories: Array<{
		name: string;
		description?: string;
		items: Array<{
			name: string;
			price: number;
			description?: string;
			allergens?: string[];
		}>;
	}>;
}): ExtractedMenuData {
	return {
		categories: menu.categories.map((cat) => ({
			name: cat.name,
			description: cat.description,
			items: cat.items.map((item) => ({
				name: item.name,
				price: item.price,
				description: item.description,
				allergens: item.allergens,
				categoryName: cat.name,
			})),
		})),
		optionGroups: [],
		confidence: 0.9,
	};
}

/**
 * Creates test dependencies with fake implementations.
 */
function createTestDeps(options: {
	fileContent: Buffer;
	extractionResult: ExtractedMenuData;
}): ProcessorDeps {
	return {
		getFile: vi.fn().mockResolvedValue(options.fileContent),
		extractMenuFromText: vi.fn().mockResolvedValue(options.extractionResult),
	};
}

describe("Menu Import Pipeline", () => {
	const testRunId = createTestRunId();
	let storeId: string;
	let merchantId: string;

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

	describe("Fresh Import (No Existing Menu)", () => {
		it("processes CSV and creates new categories and items", async () => {
			// 1. Create import job
			const job = await createTestImportJob({
				testRunId,
				storeId,
				fileType: "csv",
			});

			// 2. Create test dependencies
			const deps = createTestDeps({
				fileContent: loadFixture("simple-menu.csv"),
				extractionResult: createFakeExtraction({
					categories: [
						{
							name: "Starters",
							items: [
								{ name: "Tomato Soup", price: 499 },
								{
									name: "Caesar Salad",
									price: 699,
									allergens: ["gluten", "dairy"],
								},
								{
									name: "Garlic Bread",
									price: 349,
									allergens: ["gluten", "dairy"],
								},
							],
						},
						{
							name: "Mains",
							items: [
								{ name: "Classic Burger", price: 1299, allergens: ["gluten"] },
								{ name: "Grilled Salmon", price: 1899, allergens: ["fish"] },
								{ name: "Veggie Pasta", price: 1099, allergens: ["gluten"] },
							],
						},
						{
							name: "Desserts",
							items: [
								{
									name: "Chocolate Cake",
									price: 599,
									allergens: ["gluten", "dairy", "eggs"],
								},
								{ name: "Ice Cream", price: 449, allergens: ["dairy"] },
							],
						},
					],
				}),
			});

			// 3. Process the import job with injected dependencies
			await processMenuImportJob(job.id, deps);

			// 4. Verify dependencies were called
			expect(deps.getFile).toHaveBeenCalledWith(job.fileKey);
			expect(deps.extractMenuFromText).toHaveBeenCalled();

			// 5. Verify job is READY with comparison data
			const status = (await getImportJobStatus({
				data: { jobId: job.id },
			})) as ImportJobStatus;
			expect(status.status).toBe("READY");
			expect(status.comparisonData).toBeDefined();
			expect(status.comparisonData.summary.totalCategories).toBe(3);
			expect(status.comparisonData.summary.totalItems).toBe(8);
			expect(status.comparisonData.summary.newCategories).toBe(3);
			expect(status.comparisonData.summary.newItems).toBe(8);

			// 6. Apply all changes
			const selections = status.comparisonData.categories.flatMap(
				(cat: {
					extracted: { name: string };
					items: Array<{ extracted: { name: string } }>;
				}) => [
					{
						type: "category" as const,
						extractedName: cat.extracted.name,
						action: "apply" as const,
					},
					...cat.items.map((item: { extracted: { name: string } }) => ({
						type: "item" as const,
						extractedName: item.extracted.name,
						action: "apply" as const,
					})),
				],
			);

			await applyImportChanges({ data: { jobId: job.id, selections } });

			// 7. Verify data persisted in DB
			const dbCategories = await testDb.query.categories.findMany({
				where: eq(categories.storeId, storeId),
			});
			expect(dbCategories).toHaveLength(3);

			const dbItems = await testDb.query.items.findMany({
				where: eq(items.storeId, storeId),
			});
			expect(dbItems).toHaveLength(8);

			// 8. Verify job marked as COMPLETED
			const finalStatus = (await getImportJobStatus({
				data: { jobId: job.id },
			})) as ImportJobStatus;
			expect(finalStatus.status).toBe("COMPLETED");
		});
	});

	describe("Update Import (Existing Menu)", () => {
		it("detects price updates and new items", async () => {
			// 1. Pre-populate DB with existing menu
			const existingCategory = await createTestCategory({
				testRunId,
				storeId,
				name: "Appetizers",
			});

			const existingItem = await createTestItem({
				testRunId,
				storeId,
				categoryId: existingCategory.id,
				name: "Spring Rolls",
				price: 599, // Original price
			});

			// 2. Create import job
			const job = await createTestImportJob({
				testRunId,
				storeId,
				fileType: "csv",
			});

			// 3. Create test dependencies with updated prices and new item
			const deps = createTestDeps({
				fileContent: Buffer.from(
					"Category,Item,Price\nAppetizers,Spring Rolls,699\nAppetizers,New Item,899",
				),
				extractionResult: createFakeExtraction({
					categories: [
						{
							name: "Appetizers",
							items: [
								{ name: "Spring Rolls", price: 699 }, // Price increased
								{ name: "New Item", price: 899 }, // Brand new
							],
						},
					],
				}),
			});

			// 4. Process the job
			await processMenuImportJob(job.id, deps);

			// 5. Verify comparison detected update and create
			const status = (await getImportJobStatus({
				data: { jobId: job.id },
			})) as ImportJobStatus;
			expect(status.status).toBe("READY");

			const categoryComp = status.comparisonData.categories[0];
			// Category action is "skip" when the category itself matches exactly (no name change)
			// Items within it can still be created/updated
			expect(categoryComp.existingId).toBeDefined(); // Found the existing category

			// Find Spring Rolls item
			const springRollsComp = categoryComp.items.find(
				(i: { extracted: { name: string } }) =>
					i.extracted.name === "Spring Rolls",
			);
			expect(springRollsComp).toBeDefined();
			expect(springRollsComp?.action).toBe("update");
			expect(springRollsComp?.changes).toBeDefined();
			expect(
				springRollsComp?.changes?.some(
					(c: { field: string }) => c.field === "price",
				),
			).toBe(true);

			// Find New Item
			const newItemComp = categoryComp.items.find(
				(i: { extracted: { name: string } }) => i.extracted.name === "New Item",
			);
			expect(newItemComp).toBeDefined();
			expect(newItemComp?.action).toBe("create");

			// 6. Apply all changes
			const selections = [
				{
					type: "category" as const,
					extractedName: "Appetizers",
					action: "apply" as const,
				},
				{
					type: "item" as const,
					extractedName: "Spring Rolls",
					action: "apply" as const,
				},
				{
					type: "item" as const,
					extractedName: "New Item",
					action: "apply" as const,
				},
			];

			await applyImportChanges({ data: { jobId: job.id, selections } });

			// 7. Verify price was updated
			const updatedItem = await testDb.query.items.findFirst({
				where: eq(items.id, existingItem.id),
			});
			expect(updatedItem?.price).toBe(699);

			// 8. Verify new item was created
			const allItems = await testDb.query.items.findMany({
				where: eq(items.categoryId, existingCategory.id),
			});
			expect(allItems.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe("Selection Filtering", () => {
		it("only applies selected items", async () => {
			// 1. Create import job
			const job = await createTestImportJob({
				testRunId,
				storeId,
				fileType: "csv",
			});

			// 2. Create test dependencies with 3 items
			const deps = createTestDeps({
				fileContent: Buffer.from(
					"Category,Item,Price\nFiltered,Item A,100\nFiltered,Item B,200\nFiltered,Item C,300",
				),
				extractionResult: createFakeExtraction({
					categories: [
						{
							name: "Filtered Category",
							items: [
								{ name: "Item A", price: 100 },
								{ name: "Item B", price: 200 },
								{ name: "Item C", price: 300 },
							],
						},
					],
				}),
			});

			// 3. Process the job
			await processMenuImportJob(job.id, deps);

			// 4. Verify job is READY
			const status = (await getImportJobStatus({
				data: { jobId: job.id },
			})) as ImportJobStatus;
			expect(status.status).toBe("READY");
			expect(status.comparisonData.summary.totalItems).toBe(3);

			// 5. Apply only Item A (skip B and C)
			const selections = [
				{
					type: "category" as const,
					extractedName: "Filtered Category",
					action: "apply" as const,
				},
				{
					type: "item" as const,
					extractedName: "Item A",
					action: "apply" as const,
				},
				// Item B and Item C are NOT included in selections
			];

			await applyImportChanges({ data: { jobId: job.id, selections } });

			// 6. Find the created category and verify only 1 item was created
			const createdCategories = await testDb.query.categories.findMany({
				where: eq(categories.storeId, storeId),
			});

			const targetCategory = createdCategories.find(
				(c) => c.translations?.de?.name === "Filtered Category",
			);

			expect(targetCategory).toBeDefined();
			if (targetCategory) {
				const categoryItems = await testDb.query.items.findMany({
					where: eq(items.categoryId, targetCategory.id),
				});
				expect(categoryItems).toHaveLength(1);
				expect(categoryItems[0].translations?.de?.name).toBe("Item A");
			}
		});
	});

	describe("Error Handling", () => {
		it("marks job as FAILED when file download fails", async () => {
			// 1. Create import job
			const job = await createTestImportJob({
				testRunId,
				storeId,
				fileType: "csv",
			});

			// 2. Create deps with failing getFile
			const deps: ProcessorDeps = {
				getFile: vi.fn().mockRejectedValue(new Error("File not found")),
				extractMenuFromText: vi.fn(),
			};

			// 3. Process should throw and mark job as failed
			await expect(processMenuImportJob(job.id, deps)).rejects.toThrow(
				"File not found",
			);

			// 4. Verify job is marked as FAILED
			const status = await testDb.query.menuImportJobs.findFirst({
				where: eq(menuImportJobs.id, job.id),
			});
			expect(status?.status).toBe("FAILED");
			expect(status?.errorMessage).toBe("File not found");
		});

		it("marks job as FAILED when AI extraction fails", async () => {
			// 1. Create import job
			const job = await createTestImportJob({
				testRunId,
				storeId,
				fileType: "csv",
			});

			// 2. Create deps with failing extractMenuFromText
			const deps: ProcessorDeps = {
				getFile: vi
					.fn()
					.mockResolvedValue(Buffer.from("Category,Item,Price\nTest,Item,100")),
				extractMenuFromText: vi
					.fn()
					.mockRejectedValue(new Error("AI service unavailable")),
			};

			// 3. Process should throw and mark job as failed
			await expect(processMenuImportJob(job.id, deps)).rejects.toThrow(
				"AI service unavailable",
			);

			// 4. Verify job is marked as FAILED
			const status = await testDb.query.menuImportJobs.findFirst({
				where: eq(menuImportJobs.id, job.id),
			});
			expect(status?.status).toBe("FAILED");
			expect(status?.errorMessage).toBe("AI service unavailable");
		});
	});
});
