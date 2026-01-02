import { createFileRoute, redirect } from "@tanstack/react-router";
import { ConsoleLayout } from "@/components/layout/console-layout";
import { getMerchantOrNull } from "@/features/console/auth/server/merchant.functions";
import { storeQueries } from "@/features/console/stores/queries";

export const Route = createFileRoute("/console")({
	beforeLoad: async ({ location }) => {
		const merchant = await getMerchantOrNull();

		// If no merchant exists and not on onboarding, redirect to onboarding
		if (!merchant && !location.pathname.startsWith("/console/onboarding")) {
			throw redirect({ to: "/console/onboarding" });
		}

		// If no merchant (on onboarding page), return null context
		if (!merchant) {
			return {
				merchant: null,
				merchantId: null,
				displayLanguage: "de",
			};
		}

		return {
			merchant,
			merchantId: merchant.id,
			displayLanguage: merchant.supportedLanguages?.[0] ?? "de",
		};
	},
	loader: async ({ context }) => {
		// Only preload stores if merchant exists
		if (context.merchantId) {
			await context.queryClient.ensureQueryData(storeQueries.list());
		}
	},
	component: ConsoleLayout,
});
