import { createFileRoute, redirect } from "@tanstack/react-router";
import { ConsoleLayout } from "@/components/layout/console-layout";
import { getMerchantOrNull } from "@/features/console/auth/server/merchant.functions";

/**
 * Parent console route - provides layout and merchant context.
 * Fetches merchant once and caches forever (until page refresh).
 * All child routes inherit merchant from context - no need for requireMerchant().
 */
export const Route = createFileRoute("/console")({
	beforeLoad: async ({ context, location }) => {
		// Use TanStack Query cache - fetch once, cache forever
		const merchant = await context.queryClient.ensureQueryData({
			queryKey: ["current-merchant"],
			queryFn: () => getMerchantOrNull(),
			staleTime: Number.POSITIVE_INFINITY,
		});

		// Redirect to onboarding if no merchant (except if already on onboarding)
		if (!merchant && !location.pathname.startsWith("/console/onboarding")) {
			throw redirect({ to: "/console/onboarding" });
		}

		return {
			merchant,
			merchantId: merchant?.id ?? null,
		};
	},
	component: ConsoleLayout,
});
