import { createFileRoute, redirect } from "@tanstack/react-router";
import { ConsoleLayout } from "@/components/layout/console-layout";

export const Route = createFileRoute("/_app")({
	beforeLoad: async ({ context }) => {
		// Load merchant data via tRPC - centralizes auth for all /_app/* routes
		const merchant = await context.trpcClient.auth.getMerchantOrNull.query();

		// Redirect unauthenticated users to onboarding
		if (!merchant) {
			throw redirect({
				to: "/onboarding",
				replace: true,
			});
		}

		// Return merges into router context - available to all child routes
		return {
			merchant,
			merchantId: merchant.id,
		};
	},
	component: AppLayout,
});

function AppLayout() {
	return <ConsoleLayout />;
}
