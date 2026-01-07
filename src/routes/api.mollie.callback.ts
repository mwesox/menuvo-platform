/**
 * Mollie OAuth Callback API Route
 *
 * Handles the OAuth callback from Mollie after merchant authorization.
 * NOTE: Server-only imports are dynamically imported inside handler
 * to prevent bundling in client via routeTree.gen.ts.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/mollie/callback")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				// Dynamic imports to prevent client bundling
				const [{ eq }, { db }, { merchants }, { mollieLogger }, mollie] =
					await Promise.all([
						import("drizzle-orm"),
						import("@/db"),
						import("@/db/schema"),
						import("@/lib/logger"),
						import("@/lib/mollie"),
					]);

				const {
					createMollieClientWithToken,
					enableDefaultPaymentMethods,
					exchangeCodeForTokens,
					getOnboardingStatus,
					storeMerchantTokens,
				} = mollie;

				function redirectTo(path: string, requestUrl: string): Response {
					const origin = new URL(requestUrl).origin;
					const url = `${origin}${path}`;
					mollieLogger.info({ redirectUrl: url }, "Redirecting");
					return new Response(null, {
						status: 302,
						headers: { Location: url, "Content-Length": "0" },
					});
				}

				mollieLogger.info({ url: request.url }, "Mollie callback route hit");

				try {
					const url = new URL(request.url);
					const code = url.searchParams.get("code");
					const state = url.searchParams.get("state");
					const error = url.searchParams.get("error");
					const errorDescription = url.searchParams.get("error_description");

					// Handle error from Mollie
					if (error) {
						mollieLogger.error(
							{ error, errorDescription },
							"Mollie OAuth error received",
						);
						return redirectTo(
							`/console/settings/payments?from=mollie&error=${error}`,
							request.url,
						);
					}

					// Validate code and state
					if (!code || !state) {
						mollieLogger.error(
							{ hasCode: !!code, hasState: !!state },
							"Mollie OAuth missing params",
						);
						return redirectTo(
							`/console/settings/payments?from=mollie&error=missing_params`,
							request.url,
						);
					}

					// Parse merchantId from state (base64url encoded)
					let merchantId: string;
					try {
						// Convert base64url to standard base64, then decode
						const base64 = state.replace(/-/g, "+").replace(/_/g, "/");
						const decoded = atob(base64);
						const stateData = JSON.parse(decoded);
						merchantId = stateData.merchantId;

						if (!merchantId || typeof merchantId !== "string") {
							throw new Error("Invalid merchantId in state");
						}
					} catch (err) {
						mollieLogger.error(
							{ error: err instanceof Error ? err.message : String(err) },
							"Failed to parse OAuth state",
						);
						return redirectTo(
							`/console/settings/payments?from=mollie&error=invalid_state`,
							request.url,
						);
					}

					mollieLogger.info({ merchantId }, "Processing Mollie OAuth callback");

					// 1. Exchange code for tokens
					const tokens = await exchangeCodeForTokens(code);

					// 2. Store encrypted tokens
					await storeMerchantTokens(merchantId, tokens);

					// 3. Fetch organization and profile info using the new access token
					const mollieClient = createMollieClientWithToken(tokens.accessToken);

					// Get organization
					const org = await mollieClient.organizations.getCurrent();
					mollieLogger.info({ orgId: org.id }, "Fetched Mollie organization");

					// Get first profile (merchants typically have one)
					const profiles = await mollieClient.profiles.page();
					const profileId = profiles.length > 0 ? profiles[0].id : null;
					mollieLogger.info({ profileId }, "Fetched Mollie profile");

					// Enable default payment methods on the profile
					if (profileId) {
						const methodsResult = await enableDefaultPaymentMethods(
							mollieClient,
							profileId,
						);
						mollieLogger.info(
							{
								profileId,
								enabled: methodsResult.enabled,
								failed: methodsResult.failed,
							},
							"Default payment methods setup completed",
						);
					}

					// Get onboarding status
					const onboardingStatus = await getOnboardingStatus(
						tokens.accessToken,
					);
					mollieLogger.info(
						{
							status: onboardingStatus.status,
							canReceivePayments: onboardingStatus.canReceivePayments,
						},
						"Fetched onboarding status",
					);

					// 4. Update merchant with all Mollie data
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
							mollieCanReceiveSettlements:
								onboardingStatus.canReceiveSettlements,
						})
						.where(eq(merchants.id, merchantId));

					mollieLogger.info(
						{ merchantId, orgId: org.id },
						"Mollie OAuth completed - all data stored",
					);

					// Redirect back to payments page
					return redirectTo(
						`/console/settings/payments?from=mollie`,
						request.url,
					);
				} catch (err) {
					mollieLogger.error(
						{
							error: err instanceof Error ? err.message : String(err),
							stack: err instanceof Error ? err.stack : undefined,
						},
						"Mollie OAuth callback failed",
					);
					// Return error with explicit Content-Length to avoid chunked encoding issues
					const errorBody = JSON.stringify({
						error: "OAuth callback failed",
						details: err instanceof Error ? err.message : String(err),
					});
					return new Response(errorBody, {
						status: 500,
						headers: {
							"Content-Type": "application/json",
							"Content-Length": String(
								new TextEncoder().encode(errorBody).length,
							),
						},
					});
				}
			},
		},
	},
});
