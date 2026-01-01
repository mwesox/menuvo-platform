import { createFileRoute } from "@tanstack/react-router";
import { SubscriptionSettingsPage } from "@/features/console/settings/components/subscription/subscription-settings-page";
import { subscriptionQueries } from "@/features/console/settings/queries";

// For now, hardcode merchantId=1 (in production, get from auth context)
const MERCHANT_ID = 1;

export const Route = createFileRoute("/console/settings/subscription")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			subscriptionQueries.detail(MERCHANT_ID),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <SubscriptionSettingsPage merchantId={MERCHANT_ID} />;
}
