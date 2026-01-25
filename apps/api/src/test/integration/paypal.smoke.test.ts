/**
 * PayPal Smoke Tests
 *
 * Integration tests that verify PayPal sandbox connectivity.
 * These tests call the real PayPal sandbox API.
 *
 * Requirements:
 * - PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set
 * - PAYPAL_MODE should be "sandbox" for testing
 * - PAYPAL_PARTNER_MERCHANT_ID must be set
 */

import { beforeAll, describe, expect, it } from "vitest";
import {
	createPartnerReferral,
	getAccessToken,
	isSandbox,
} from "../../domains/payments/paypal.js";

// Skip tests if PayPal credentials are not configured
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_PARTNER_MERCHANT_ID = process.env.PAYPAL_PARTNER_MERCHANT_ID;

const hasPayPalCredentials =
	Boolean(PAYPAL_CLIENT_ID) &&
	Boolean(PAYPAL_CLIENT_SECRET) &&
	Boolean(PAYPAL_PARTNER_MERCHANT_ID);

describe.skipIf(!hasPayPalCredentials)("PayPal Integration", () => {
	beforeAll(() => {
		console.log("Running PayPal smoke tests against sandbox");
		console.log(`PayPal mode: ${process.env.PAYPAL_MODE || "sandbox"}`);
		console.log(`Is sandbox: ${isSandbox()}`);
	});

	describe("OAuth2 Authentication", () => {
		it("should obtain access token from PayPal", async () => {
			const token = await getAccessToken();

			expect(token).toBeDefined();
			expect(typeof token).toBe("string");
			expect(token.length).toBeGreaterThan(0);
		});

		it("should cache and reuse access token", async () => {
			// First call
			const token1 = await getAccessToken();

			// Second call should return cached token
			const token2 = await getAccessToken();

			expect(token1).toBe(token2);
		});
	});

	describe("Partner Referrals (Onboarding)", () => {
		it("should create partner referral URL for merchant onboarding", async () => {
			const testMerchantId = `test-${Date.now()}`;

			const result = await createPartnerReferral({
				merchantId: testMerchantId,
				email: `test-${testMerchantId}@example.com`,
				businessName: "Test Restaurant Smoke Test",
				returnUrl: "https://menuvo.app/settings/payments",
			});

			expect(result).toBeDefined();
			expect(result.trackingId).toBe(`menuvo_${testMerchantId}`);
			expect(result.onboardingUrl).toBeDefined();
			expect(result.onboardingUrl).toContain("paypal.com");
		});
	});
});

// Skipped tests - these require a fully onboarded sandbox merchant
describe.skip("PayPal Order Operations", () => {
	// These tests require:
	// - A sandbox merchant account that has completed onboarding
	// - The merchant's PayPal merchant ID stored in our system
	// - They would test createOrder, captureOrder, getOrderStatus

	it.todo("should create PayPal order for checkout");
	it.todo("should capture approved PayPal order");
	it.todo("should get order status");
});
