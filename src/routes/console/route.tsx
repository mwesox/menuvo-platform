import { createFileRoute } from "@tanstack/react-router";
import { ConsoleLayout } from "@/components/layout/console-layout";
import { getMerchant } from "@/features/console/auth/server/merchant.functions";
import { storeQueries } from "@/features/console/stores/queries";

export const Route = createFileRoute("/console")({
	beforeLoad: async () => {
		const merchant = await getMerchant();
		return {
			merchant,
			merchantId: merchant.id,
			displayLanguage: merchant.supportedLanguages?.[0] ?? "de",
		};
	},
	loader: async ({ context }) => {
		// Preload stores to prevent Suspense fallback on navigation
		await context.queryClient.ensureQueryData(storeQueries.list());
	},
	component: ConsoleLayout,
});
