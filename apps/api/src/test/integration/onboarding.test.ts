/**
 * Onboarding Integration Tests - VAT Group Templates
 *
 * Tests that when a merchant is onboarded, the correct VAT groups
 * are created based on the store's country.
 */

import type { Database } from "@menuvo/db";
import { vatGroups } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { VatService } from "../../domains/menu/vat/service.js";
import { MerchantsService } from "../../domains/merchants/service.js";
import { OnboardingService } from "../../domains/onboarding/service.js";
import { StoreService } from "../../domains/stores/service.js";
import { setupTestDb, teardownTestDb } from "../db.js";
import { cleanupTestData } from "../utils/cleanup.js";
import { createTestRunId, uniqueEmail } from "../utils/test-id.js";

describe("Onboarding Integration - VAT Group Templates", () => {
	const testRunId = createTestRunId();
	let db: Database;
	let onboardingService: OnboardingService;

	beforeAll(async () => {
		const { testDb } = await setupTestDb();
		db = testDb;

		// Wire up services with test DB
		const merchantsService = new MerchantsService(db);
		const storesService = new StoreService(db);
		const vatService = new VatService(db);
		onboardingService = new OnboardingService(
			db,
			merchantsService,
			storesService,
			vatService,
		);
	});

	afterAll(async () => {
		await cleanupTestData(testRunId);
		await teardownTestDb();
	});

	it("creates German VAT groups (19% and 7%) for country 'Deutschland'", async () => {
		const result = await onboardingService.onboard({
			merchant: {
				name: "Test DE",
				ownerName: "Test Owner",
				email: uniqueEmail(testRunId),
			},
			store: {
				name: "German Store",
				street: "Test St",
				city: "Berlin",
				postalCode: "10115",
				country: "Deutschland",
			},
		});

		// Wait for fire-and-forget VAT creation
		await new Promise((r) => setTimeout(r, 200));

		const groups = await db.query.vatGroups.findMany({
			where: eq(vatGroups.merchantId, result.merchant.id),
		});

		expect(groups).toHaveLength(2);
		expect(groups.map((g) => g.rate).sort((a, b) => a - b)).toEqual([
			700, 1900,
		]);
		expect(groups.map((g) => g.code).sort()).toEqual(["NORM", "RED"]);
	});

	it("creates Austrian VAT groups (20% and 10%) for country 'Österreich'", async () => {
		const result = await onboardingService.onboard({
			merchant: {
				name: "Test AT",
				ownerName: "Test Owner",
				email: uniqueEmail(testRunId),
			},
			store: {
				name: "Austrian Store",
				street: "Test St",
				city: "Vienna",
				postalCode: "1010",
				country: "Österreich",
			},
		});

		await new Promise((r) => setTimeout(r, 200));

		const groups = await db.query.vatGroups.findMany({
			where: eq(vatGroups.merchantId, result.merchant.id),
		});

		expect(groups).toHaveLength(2);
		expect(groups.map((g) => g.rate).sort((a, b) => a - b)).toEqual([
			1000, 2000,
		]);
	});

	it("creates Swiss VAT groups (8.1%, 2.6%, 3.8%) for country 'Switzerland'", async () => {
		const result = await onboardingService.onboard({
			merchant: {
				name: "Test CH",
				ownerName: "Test Owner",
				email: uniqueEmail(testRunId),
			},
			store: {
				name: "Swiss Store",
				street: "Test St",
				city: "Zurich",
				postalCode: "8001",
				country: "Switzerland",
			},
		});

		await new Promise((r) => setTimeout(r, 200));

		const groups = await db.query.vatGroups.findMany({
			where: eq(vatGroups.merchantId, result.merchant.id),
		});

		expect(groups).toHaveLength(3);
		expect(groups.map((g) => g.rate).sort((a, b) => a - b)).toEqual([
			260, 380, 810,
		]);
	});

	it("uses explicit countryCode over derived country name", async () => {
		const result = await onboardingService.onboard({
			merchant: {
				name: "Test Explicit",
				ownerName: "Test Owner",
				email: uniqueEmail(testRunId),
			},
			store: {
				name: "Explicit Store",
				street: "Test St",
				city: "City",
				postalCode: "12345",
				country: "Unknown",
				countryCode: "AT",
			},
		});

		await new Promise((r) => setTimeout(r, 200));

		const groups = await db.query.vatGroups.findMany({
			where: eq(vatGroups.merchantId, result.merchant.id),
		});

		expect(groups).toHaveLength(2);
		// Austrian rates
		expect(groups.map((g) => g.rate).sort((a, b) => a - b)).toEqual([
			1000, 2000,
		]);
	});

	it("defaults to DE when country is unknown and no countryCode provided", async () => {
		const result = await onboardingService.onboard({
			merchant: {
				name: "Test Unknown",
				ownerName: "Test Owner",
				email: uniqueEmail(testRunId),
			},
			store: {
				name: "Unknown Store",
				street: "Test St",
				city: "City",
				postalCode: "12345",
				country: "Narnia",
			},
		});

		await new Promise((r) => setTimeout(r, 200));

		const groups = await db.query.vatGroups.findMany({
			where: eq(vatGroups.merchantId, result.merchant.id),
		});

		// Defaults to DE when country can't be derived
		expect(groups).toHaveLength(2);
		expect(groups.map((g) => g.rate).sort((a, b) => a - b)).toEqual([
			700, 1900,
		]);
	});
});
