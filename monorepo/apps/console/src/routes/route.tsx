import { createFileRoute, redirect } from "@tanstack/react-router";
import { ConsoleLayout } from "@/components/layout/console-layout";
import { trpcClient } from "@/lib/trpc";

/**
 * Parent console route - provides layout and merchant context.
 * Fetches merchant from server on each navigation (reads from cookie).
 * All child routes inherit merchant from context.
 */
export const Route = createFileRoute("")({
	beforeLoad: async () => {
		// Get merchant from tRPC API
		const merchant = await trpcClient.auth.getMerchantOrNull.query();

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
