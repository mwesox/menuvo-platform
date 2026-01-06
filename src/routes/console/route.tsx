import { createFileRoute, redirect } from "@tanstack/react-router";
import { ConsoleLayout } from "@/components/layout/console-layout";
import { getMerchantOrNull } from "@/features/console/auth/server/merchant.functions";

/**
 * Parent console route - provides layout and merchant context.
 * Fetches merchant from server on each navigation (reads from cookie).
 * All child routes inherit merchant from context.
 */
export const Route = createFileRoute("/console")({
	beforeLoad: async () => {
		// Get merchant from server (reads cookie via getMerchantIdFromCookie)
		const merchant = await getMerchantOrNull();

		// Redirect to onboarding if no merchant session
		if (!merchant) {
			throw redirect({ to: "/onboarding" });
		}

		return {
			merchant,
			merchantId: merchant.id,
		};
	},
	component: ConsoleLayout,
});
