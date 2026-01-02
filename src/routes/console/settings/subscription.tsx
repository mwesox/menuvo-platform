import { createFileRoute } from "@tanstack/react-router";
import { requireMerchant } from "@/features/console/auth/server/merchant.functions";
import { SubscriptionSettingsPage } from "@/features/console/settings/components/subscription/subscription-settings-page";
import { subscriptionQueries } from "@/features/console/settings/queries";

export const Route = createFileRoute("/console/settings/subscription")({
	beforeLoad: async () => requireMerchant(),
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			subscriptionQueries.detail(context.merchantId),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { merchantId } = Route.useRouteContext();
	return <SubscriptionSettingsPage merchantId={merchantId} />;
}
