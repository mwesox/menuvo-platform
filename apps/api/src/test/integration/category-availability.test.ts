/**
 * Category Availability Integration Tests
 *
 * Tests that category availability scheduling works correctly end-to-end.
 * Verifies that categories are filtered based on time-of-day, day-of-week,
 * and date range rules when customers access the shop menu.
 */

import type { Database } from "@menuvo/db";
import type { CategoryAvailabilitySchedule } from "@menuvo/db/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CategoriesService } from "../../domains/menu/categories/service.js";
import type { IItemsService } from "../../domains/menu/items/interface.js";
import { MenuQueryService } from "../../domains/menu/queries/service.js";
import { MerchantsService } from "../../domains/merchants/service.js";
import { StoreService } from "../../domains/stores/service.js";
import { setupTestDb, teardownTestDb } from "../db.js";
import { cleanupTestData } from "../utils/cleanup.js";
import { createTestRunId, uniqueEmail } from "../utils/test-id.js";

describe("Category Availability Integration", () => {
	const testRunId = createTestRunId();
	let db: Database;
	let merchantsService: MerchantsService;
	let storesService: StoreService;
	let categoriesService: CategoriesService;
	let menuQueryService: MenuQueryService;
	let merchantId: string;
	let storeId: string;
	let storeSlug: string;

	beforeAll(async () => {
		const { testDb } = await setupTestDb();
		db = testDb;

		// Wire up services
		merchantsService = new MerchantsService(db);
		storesService = new StoreService(db);
		categoriesService = new CategoriesService(db);
		menuQueryService = new MenuQueryService(db, {} as IItemsService); // ItemsService not needed for these tests

		// Create merchant and store for all tests
		const merchant = await merchantsService.create({
			name: "Test Merchant",
			ownerName: "Test Owner",
			email: uniqueEmail(testRunId),
			phone: "+1234567890",
			supportedLanguages: ["de", "en"],
		});
		merchantId = merchant.id;

		const store = await storesService.create(merchantId, {
			name: "Test Store",
			slug: `test-store-${testRunId}`,
			street: "Test Street",
			city: "Berlin",
			postalCode: "10115",
			country: "Deutschland",
			phone: "+1234567890",
			email: uniqueEmail(testRunId),
			timezone: "Europe/Berlin",
		});
		storeId = store.id;
		storeSlug = store.slug;
	});

	afterAll(async () => {
		await cleanupTestData(testRunId);
		await teardownTestDb();
	});

	// Helper function to create a category
	async function createCategory(
		name: string,
		availabilitySchedule?: CategoryAvailabilitySchedule | null,
	): Promise<string> {
		const category = await categoriesService.create(merchantId, {
			storeId,
			translations: {
				de: { name, description: `Description for ${name}` },
			},
			isActive: true,
			availabilitySchedule: availabilitySchedule ?? null,
		});
		return category.id;
	}

	// Helper function to get category names from shop menu
	async function getCategoryNames(): Promise<string[]> {
		const menu = await menuQueryService.getShopMenu(storeSlug, "de");
		return menu.categories.map((cat) => cat.name);
	}

	it("category with no schedule is always visible", async () => {
		await createCategory("Always Visible Category");

		const categoryNames = await getCategoryNames();
		expect(categoryNames).toContain("Always Visible Category");
	});

	it("category with disabled schedule is always visible", async () => {
		await createCategory("Disabled Schedule Category", {
			enabled: false,
			timeRange: { startTime: "09:00", endTime: "17:00" },
		});

		const categoryNames = await getCategoryNames();
		expect(categoryNames).toContain("Disabled Schedule Category");
	});

	it("category with time range is visible when current time is within range", async () => {
		// Get current time in store timezone
		const now = new Date();
		const formatter = new Intl.DateTimeFormat("en-US", {
			timeZone: "Europe/Berlin",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		const currentTime = formatter.format(now);
		const [currentHour, currentMinute] = currentTime.split(":").map(Number);
		if (currentHour === undefined || currentMinute === undefined) {
			throw new Error("Failed to parse current time");
		}
		const currentTimeMinutes = currentHour * 60 + currentMinute;

		// Create a time range that includes current time (with buffer)
		// Use a 2-hour window around current time
		const startMinutes = Math.max(0, currentTimeMinutes - 60);
		const endMinutes = Math.min(1439, currentTimeMinutes + 60);
		const startHour = Math.floor(startMinutes / 60);
		const startMin = startMinutes % 60;
		const endHour = Math.floor(endMinutes / 60);
		const endMin = endMinutes % 60;

		const startTime = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;
		const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

		await createCategory("Time Range Category", {
			enabled: true,
			timeRange: { startTime, endTime },
		});

		const categoryNames = await getCategoryNames();
		expect(categoryNames).toContain("Time Range Category");
	});

	it("category with time range is hidden when current time is outside range", async () => {
		// Get current time in store timezone
		const now = new Date();
		const formatter = new Intl.DateTimeFormat("en-US", {
			timeZone: "Europe/Berlin",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		const currentTime = formatter.format(now);
		const [currentHour] = currentTime.split(":").map(Number);
		if (currentHour === undefined) {
			throw new Error("Failed to parse current hour");
		}

		// Create a time range that excludes current time
		// If current hour is < 12, use afternoon range (13:00-17:00)
		// If current hour is >= 12, use morning range (06:00-10:00)
		const startTime = currentHour < 12 ? "13:00" : "06:00";
		const endTime = currentHour < 12 ? "17:00" : "10:00";

		await createCategory("Outside Time Range Category", {
			enabled: true,
			timeRange: { startTime, endTime },
		});

		const categoryNames = await getCategoryNames();
		expect(categoryNames).not.toContain("Outside Time Range Category");
	});

	it("category with midnight crossover is visible when current time is within range", async () => {
		// Get current time in store timezone
		const now = new Date();
		const formatter = new Intl.DateTimeFormat("en-US", {
			timeZone: "Europe/Berlin",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		const currentTime = formatter.format(now);
		const [currentHour] = currentTime.split(":").map(Number);
		if (currentHour === undefined) {
			throw new Error("Failed to parse current hour");
		}

		// Create midnight crossover range (22:00-02:00)
		// Category should be visible if current hour is >= 22 or < 2
		const startTime = "22:00";
		const endTime = "02:00";

		await createCategory("Midnight Crossover Category", {
			enabled: true,
			timeRange: { startTime, endTime },
		});

		const categoryNames = await getCategoryNames();

		// Category should be visible if it's late night (22:00-23:59) or early morning (00:00-01:59)
		if (currentHour >= 22 || currentHour < 2) {
			expect(categoryNames).toContain("Midnight Crossover Category");
		} else {
			// If current time is outside range, verify it's hidden
			expect(categoryNames).not.toContain("Midnight Crossover Category");
		}
	});

	it("category with day of week is visible when current day matches", async () => {
		// Get current day of week in store timezone
		const now = new Date();
		const formatter = new Intl.DateTimeFormat("en-US", {
			timeZone: "Europe/Berlin",
			weekday: "long",
		});
		const currentDay = formatter.format(now).toLowerCase();

		await createCategory("Day of Week Category", {
			enabled: true,
			daysOfWeek: [
				currentDay as
					| "monday"
					| "tuesday"
					| "wednesday"
					| "thursday"
					| "friday"
					| "saturday"
					| "sunday",
			],
		});

		const categoryNames = await getCategoryNames();
		expect(categoryNames).toContain("Day of Week Category");
	});

	it("category with day of week is hidden when current day does not match", async () => {
		// Get current day of week in store timezone
		const now = new Date();
		const formatter = new Intl.DateTimeFormat("en-US", {
			timeZone: "Europe/Berlin",
			weekday: "long",
		});
		const currentDay = formatter.format(now).toLowerCase();

		// Create schedule for a different day
		// If today is Monday, use Tuesday, otherwise use Monday
		const differentDay = currentDay === "monday" ? "tuesday" : "monday";

		await createCategory("Wrong Day Category", {
			enabled: true,
			daysOfWeek: [
				differentDay as
					| "monday"
					| "tuesday"
					| "wednesday"
					| "thursday"
					| "friday"
					| "saturday"
					| "sunday",
			],
		});

		const categoryNames = await getCategoryNames();
		expect(categoryNames).not.toContain("Wrong Day Category");
	});

	it("category with date range is visible when current date is within range", async () => {
		// Get current date in store timezone
		const now = new Date();
		const formatter = new Intl.DateTimeFormat("en-CA", {
			timeZone: "Europe/Berlin",
		});
		const today = formatter.format(now);
		const tomorrow = new Date(now);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowStr = formatter.format(tomorrow);

		await createCategory("Date Range Category", {
			enabled: true,
			dateRange: { startDate: today, endDate: tomorrowStr },
		});

		const categoryNames = await getCategoryNames();
		expect(categoryNames).toContain("Date Range Category");
	});

	it("category with date range is hidden when current date is outside range", async () => {
		// Create a date range in the past
		const now = new Date();
		const formatter = new Intl.DateTimeFormat("en-CA", {
			timeZone: "Europe/Berlin",
		});
		const yesterday = new Date(now);
		yesterday.setDate(yesterday.getDate() - 2);
		const dayBeforeYesterday = new Date(now);
		dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 3);

		const startDate = formatter.format(dayBeforeYesterday);
		const endDate = formatter.format(yesterday);

		await createCategory("Past Date Range Category", {
			enabled: true,
			dateRange: { startDate, endDate },
		});

		const categoryNames = await getCategoryNames();
		expect(categoryNames).not.toContain("Past Date Range Category");
	});

	it("category with combined rules is visible when all conditions pass", async () => {
		// Get current time, day, and date
		const now = new Date();
		const timeFormatter = new Intl.DateTimeFormat("en-US", {
			timeZone: "Europe/Berlin",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		const dayFormatter = new Intl.DateTimeFormat("en-US", {
			timeZone: "Europe/Berlin",
			weekday: "long",
		});
		const dateFormatter = new Intl.DateTimeFormat("en-CA", {
			timeZone: "Europe/Berlin",
		});

		const currentTime = timeFormatter.format(now);
		const [currentHour, currentMinute] = currentTime.split(":").map(Number);
		if (currentHour === undefined || currentMinute === undefined) {
			throw new Error("Failed to parse current time");
		}
		const currentTimeMinutes = currentHour * 60 + currentMinute;

		// Create time range that includes current time
		const startMinutes = Math.max(0, currentTimeMinutes - 60);
		const endMinutes = Math.min(1439, currentTimeMinutes + 60);
		const startHour = Math.floor(startMinutes / 60);
		const startMin = startMinutes % 60;
		const endHour = Math.floor(endMinutes / 60);
		const endMin = endMinutes % 60;

		const startTime = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;
		const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

		const currentDay = dayFormatter.format(now).toLowerCase();
		const today = dateFormatter.format(now);
		const tomorrow = new Date(now);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowStr = dateFormatter.format(tomorrow);

		await createCategory("Combined Rules Category", {
			enabled: true,
			timeRange: { startTime, endTime },
			daysOfWeek: [
				currentDay as
					| "monday"
					| "tuesday"
					| "wednesday"
					| "thursday"
					| "friday"
					| "saturday"
					| "sunday",
			],
			dateRange: { startDate: today, endDate: tomorrowStr },
		});

		const categoryNames = await getCategoryNames();
		expect(categoryNames).toContain("Combined Rules Category");
	});

	it("category with combined rules is hidden when one condition fails", async () => {
		// Get current day and date
		const now = new Date();
		const dayFormatter = new Intl.DateTimeFormat("en-US", {
			timeZone: "Europe/Berlin",
			weekday: "long",
		});
		const dateFormatter = new Intl.DateTimeFormat("en-CA", {
			timeZone: "Europe/Berlin",
		});

		const currentDay = dayFormatter.format(now).toLowerCase();
		// Use a different day
		const wrongDay = currentDay === "monday" ? "tuesday" : "monday";

		const today = dateFormatter.format(now);
		const tomorrow = new Date(now);
		tomorrow.setDate(tomorrow.getDate() + 1);
		const tomorrowStr = dateFormatter.format(tomorrow);

		// Use a time range that includes current time, but wrong day
		const timeFormatter = new Intl.DateTimeFormat("en-US", {
			timeZone: "Europe/Berlin",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		const currentTime = timeFormatter.format(now);
		const [currentHour, currentMinute] = currentTime.split(":").map(Number);
		if (currentHour === undefined || currentMinute === undefined) {
			throw new Error("Failed to parse current time");
		}
		const currentTimeMinutes = currentHour * 60 + currentMinute;

		const startMinutes = Math.max(0, currentTimeMinutes - 60);
		const endMinutes = Math.min(1439, currentTimeMinutes + 60);
		const startHour = Math.floor(startMinutes / 60);
		const startMin = startMinutes % 60;
		const endHour = Math.floor(endMinutes / 60);
		const endMin = endMinutes % 60;

		const startTime = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;
		const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

		await createCategory("Combined Rules Failed Category", {
			enabled: true,
			timeRange: { startTime, endTime },
			daysOfWeek: [
				wrongDay as
					| "monday"
					| "tuesday"
					| "wednesday"
					| "thursday"
					| "friday"
					| "saturday"
					| "sunday",
			],
			dateRange: { startDate: today, endDate: tomorrowStr },
		});

		const categoryNames = await getCategoryNames();
		expect(categoryNames).not.toContain("Combined Rules Failed Category");
	});

	it("category filtering respects store timezone", async () => {
		// Create a store with a different timezone (UTC)
		const utcStore = await storesService.create(merchantId, {
			name: "UTC Store",
			slug: `utc-store-${testRunId}`,
			street: "Test Street",
			city: "London",
			postalCode: "SW1A 1AA",
			country: "United Kingdom",
			phone: "+1234567890",
			email: uniqueEmail(testRunId),
			timezone: "UTC",
		});

		// Get current time in UTC
		const now = new Date();
		const utcFormatter = new Intl.DateTimeFormat("en-US", {
			timeZone: "UTC",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});
		const berlinFormatter = new Intl.DateTimeFormat("en-US", {
			timeZone: "Europe/Berlin",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});

		const utcTime = utcFormatter.format(now);
		const berlinTime = berlinFormatter.format(now);

		// If UTC and Berlin times are different, create a schedule that works for UTC but not Berlin
		// Otherwise, just verify timezone is used correctly
		const [utcHour] = utcTime.split(":").map(Number);
		const [berlinHour] = berlinTime.split(":").map(Number);
		if (utcHour === undefined || berlinHour === undefined) {
			throw new Error("Failed to parse UTC or Berlin hour");
		}

		// Create a time range around UTC time
		const startMinutes = Math.max(0, (utcHour - 1) * 60);
		const endMinutes = Math.min(1439, (utcHour + 1) * 60);
		const startHour = Math.floor(startMinutes / 60);
		const startMin = startMinutes % 60;
		const endHour = Math.floor(endMinutes / 60);
		const endMin = endMinutes % 60;

		const startTime = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;
		const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

		await categoriesService.create(merchantId, {
			storeId: utcStore.id,
			translations: {
				de: { name: "UTC Timezone Category", description: "Test timezone" },
			},
			isActive: true,
			availabilitySchedule: {
				enabled: true,
				timeRange: { startTime, endTime },
			},
		});

		// Query UTC store menu - should use UTC timezone
		const menu = await menuQueryService.getShopMenu(utcStore.slug, "de");
		const categoryNames = menu.categories.map((cat) => cat.name);

		// Category should be visible if UTC time is within range
		expect(categoryNames).toContain("UTC Timezone Category");
	});
});
