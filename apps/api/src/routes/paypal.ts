/**
 * PayPal Onboarding Return Route
 *
 * Handles the return from PayPal after merchant authorization.
 * Extracts merchant ID and tracking ID, fetches status, and redirects to console.
 */
import { db } from "@menuvo/db";
import { merchants } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { getMerchantStatus } from "../domains/payments/paypal.js";
import { env } from "../env";
import { createLogger } from "../lib/logger.js";

const paypalLogger = createLogger("paypal");
const paypal = new Hono();

/**
 * PayPal onboarding return handler
 *
 * After merchant completes PayPal onboarding, PayPal redirects here with:
 * - merchantIdInPayPal: The merchant's PayPal ID
 * - merchantId: Our tracking ID (menuvo_{merchantId})
 * - permissionsGranted: Whether permissions were granted
 * - accountStatus: The merchant's account status
 * - consentStatus: Whether consent was given
 */
paypal.get("/return", async (c) => {
	const url = new URL(c.req.url);
	const consoleUrl = env.CONSOLE_URL;

	// PayPal return parameters
	const paypalMerchantId = url.searchParams.get("merchantIdInPayPal");
	const trackingId = url.searchParams.get("merchantId"); // This is actually our tracking ID
	const permissionsGranted = url.searchParams.get("permissionsGranted");
	const isEmailConfirmed = url.searchParams.get("isEmailConfirmed");
	const accountStatus = url.searchParams.get("accountStatus");

	paypalLogger.info(
		{
			paypalMerchantId,
			trackingId,
			permissionsGranted,
			isEmailConfirmed,
			accountStatus,
		},
		"Processing PayPal onboarding return",
	);

	// Validate required parameters
	if (!paypalMerchantId || !trackingId) {
		paypalLogger.error(
			{ paypalMerchantId, trackingId },
			"Missing required parameters in PayPal return",
		);
		return c.redirect(
			`${consoleUrl}/settings/payments?from=paypal&error=missing_params`,
		);
	}

	// Extract merchant ID from tracking ID (menuvo_{merchantId})
	const merchantIdMatch = trackingId.match(/^menuvo_(.+)$/);
	if (!merchantIdMatch || !merchantIdMatch[1]) {
		paypalLogger.error(
			{ trackingId },
			"Invalid tracking ID format in PayPal return",
		);
		return c.redirect(
			`${consoleUrl}/settings/payments?from=paypal&error=invalid_tracking_id`,
		);
	}

	const merchantId = merchantIdMatch[1];

	try {
		// Verify merchant exists and has matching tracking ID
		const merchant = await db.query.merchants.findFirst({
			where: eq(merchants.id, merchantId),
			columns: {
				id: true,
				paypalTrackingId: true,
				paypalMerchantId: true,
			},
		});

		if (!merchant) {
			paypalLogger.error({ merchantId }, "Merchant not found");
			return c.redirect(
				`${consoleUrl}/settings/payments?from=paypal&error=merchant_not_found`,
			);
		}

		// Verify tracking ID matches (security check)
		if (merchant.paypalTrackingId !== trackingId) {
			paypalLogger.error(
				{
					merchantId,
					expectedTrackingId: merchant.paypalTrackingId,
					receivedTrackingId: trackingId,
				},
				"Tracking ID mismatch",
			);
			return c.redirect(
				`${consoleUrl}/settings/payments?from=paypal&error=tracking_id_mismatch`,
			);
		}

		// Fetch merchant status from PayPal
		const status = await getMerchantStatus(paypalMerchantId, trackingId);

		paypalLogger.info(
			{
				merchantId,
				paypalMerchantId,
				paymentsReceivable: status.paymentsReceivable,
				primaryEmailConfirmed: status.primaryEmailConfirmed,
				onboardingStatus: status.onboardingStatus,
			},
			"PayPal merchant status fetched",
		);

		// Update merchant with PayPal merchant ID and status
		await db
			.update(merchants)
			.set({
				paypalMerchantId: paypalMerchantId,
				paypalOnboardingStatus: status.onboardingStatus,
				paypalPaymentsReceivable: status.paymentsReceivable,
				paypalPrimaryEmailConfirmed: status.primaryEmailConfirmed,
			})
			.where(eq(merchants.id, merchantId));

		paypalLogger.info(
			{ merchantId, paypalMerchantId },
			"PayPal onboarding completed",
		);

		return c.redirect(`${consoleUrl}/settings/payments?from=paypal`);
	} catch (err) {
		paypalLogger.error(
			{ error: err, merchantId },
			"PayPal return handler failed",
		);
		return c.redirect(
			`${consoleUrl}/settings/payments?from=paypal&error=return_failed`,
		);
	}
});

export { paypal };
