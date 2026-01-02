import { createFileRoute } from "@tanstack/react-router";
import { SubscriptionSettingsPage } from "@/features/console/settings/components/subscription/subscription-settings-page";
import { subscriptionQueries } from "@/features/console/settings/queries";

export const Route = createFileRoute("/console/settings/subscription")({
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			// biome-ignore lint/style/noNonNullAssertion: Parent route redirects to onboarding if null
			subscriptionQueries.detail(context.merchantId!),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { merchantId } = Route.useRouteContext();
	// biome-ignore lint/style/noNonNullAssertion: Parent route redirects to onboarding if null
	return <SubscriptionSettingsPage merchantId={merchantId!} />;
}
