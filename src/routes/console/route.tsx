import { createFileRoute } from "@tanstack/react-router";
import { ConsoleLayout } from "@/components/layout/console-layout";
import { getMerchantOrNull } from "@/features/console/auth/server/merchant.functions";

/**
 * Parent console route - provides layout and merchant context.
 * Individual routes handle their own merchant requirements via requireMerchant.
 */
export const Route = createFileRoute("/console")({
	beforeLoad: async () => {
		const merchant = await getMerchantOrNull();
		return {
			merchant,
			merchantId: merchant?.id ?? null,
		};
	},
	component: ConsoleLayout,
});
