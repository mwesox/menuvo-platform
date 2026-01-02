import { createFileRoute } from "@tanstack/react-router";
import { SubscriptionSettingsPage } from "@/features/console/settings/components/subscription/subscription-settings-page";
import { subscriptionQueries } from "@/features/console/settings/queries";

export const Route = createFileRoute("/console/settings/subscription")({
	loader: async ({ context }) => {
		// merchantId from parent /console route context
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
