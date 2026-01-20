/**
 * Mollie OAuth Callback Route
 *
 * Handles the OAuth callback from Mollie after merchant authorization.
 * Exchanges the authorization code for tokens, fetches org/profile info,
 * and redirects back to the console app.
 */
import { db } from "@menuvo/db";
import { merchants } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import {
	createMollieClientWithToken,
	enableDefaultPaymentMethods,
	exchangeCodeForTokens,
	getOnboardingStatus,
	storeMerchantTokens,
} from "../domains/payments/mollie.js";
import { env } from "../env";

const mollie = new Hono();

mollie.get("/callback", async (c) => {
	const url = new URL(c.req.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const error = url.searchParams.get("error");
	const errorDescription = url.searchParams.get("error_description");

	// Console URL for redirects (default set in env.ts)
	const consoleUrl = env.CONSOLE_URL;

	// Handle error from Mollie
	if (error) {
		console.error("Mollie OAuth error:", { error, errorDescription });
		return c.redirect(
			`${consoleUrl}/settings/payments?from=mollie&error=${error}`,
		);
	}

	// Validate params
	if (!code || !state) {
		console.error("Mollie OAuth missing params:", {
			hasCode: !!code,
			hasState: !!state,
		});
		return c.redirect(
			`${consoleUrl}/settings/payments?from=mollie&error=missing_params`,
		);
	}

	// Parse merchantId from state (base64url encoded)
	let merchantId: string;
	try {
		const base64 = state.replace(/-/g, "+").replace(/_/g, "/");
		const decoded = atob(base64);
		const stateData = JSON.parse(decoded);
		merchantId = stateData.merchantId;

		if (!merchantId || typeof merchantId !== "string") {
			throw new Error("Invalid merchantId in state");
		}
	} catch (err) {
		console.error("Failed to parse OAuth state:", err);
		return c.redirect(
			`${consoleUrl}/settings/payments?from=mollie&error=invalid_state`,
		);
	}

	console.log("Processing Mollie OAuth callback for merchant:", merchantId);

	try {
		// 1. Exchange code for tokens
		const tokens = await exchangeCodeForTokens(code);

		// 2. Store tokens
		await storeMerchantTokens(merchantId, tokens);

		// 3. Fetch org and profile info
		const mollieClient = createMollieClientWithToken(tokens.accessToken);
		const org = await mollieClient.organizations.getCurrent();
		console.log("Fetched Mollie organization:", org.id);

		const profiles = await mollieClient.profiles.page();
		const profileId = profiles.length > 0 ? (profiles[0]?.id ?? null) : null;
		console.log("Fetched Mollie profile:", profileId);

		// 4. Enable default payment methods
		if (profileId) {
			const methodsResult = await enableDefaultPaymentMethods(
				mollieClient,
				profileId,
			);
			console.log("Default payment methods setup:", {
				enabled: methodsResult.enabled,
				failed: methodsResult.failed,
			});
		}

		// 5. Get onboarding status
		const onboardingStatus = await getOnboardingStatus(tokens.accessToken);
		console.log("Onboarding status:", {
			status: onboardingStatus.status,
			canReceivePayments: onboardingStatus.canReceivePayments,
		});

		// 6. Update merchant
		await db
			.update(merchants)
			.set({
				mollieOrganizationId: org.id,
				mollieProfileId: profileId,
				mollieOnboardingStatus: onboardingStatus.canReceivePayments
					? "completed"
					: onboardingStatus.status === "in-review"
						? "in-review"
						: "needs-data",
				mollieCanReceivePayments: onboardingStatus.canReceivePayments,
				mollieCanReceiveSettlements: onboardingStatus.canReceiveSettlements,
			})
			.where(eq(merchants.id, merchantId));

		console.log("Mollie OAuth completed for merchant:", merchantId);

		return c.redirect(`${consoleUrl}/settings/payments?from=mollie`);
	} catch (err) {
		console.error("Mollie OAuth callback failed:", err);
		return c.redirect(
			`${consoleUrl}/settings/payments?from=mollie&error=callback_failed`,
		);
	}
});

export { mollie };
