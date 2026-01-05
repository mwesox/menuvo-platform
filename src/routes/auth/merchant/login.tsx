import { createFileRoute } from "@tanstack/react-router";
import { MerchantLoginPage } from "@/features/console/auth/components/merchant-login-page";
import { authQueries } from "@/features/console/auth/queries";

export const Route = createFileRoute("/auth/merchant/login")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(authQueries.allMerchants);
	},
	component: MerchantLoginPage,
});
