import { createFileRoute } from "@tanstack/react-router";
import { ConsoleError } from "@/features/components/console-error";
import { SubscriptionSettingsPageSkeleton } from "@/features/settings/components/skeletons";
import { SubscriptionSettingsPage } from "@/features/settings/components/subscription/subscription-settings-page";
import { subscriptionQueries } from "@/features/settings/queries";

export const Route = createFileRoute("/settings/subscription")({
	loader: async ({ context }) => {
		// merchantId is guaranteed by parent route redirect
		if (!context.merchantId) return;
		await context.queryClient.ensureQueryData(
			subscriptionQueries.detail(context.merchantId),
		);
	},
	component: RouteComponent,
	pendingComponent: SubscriptionSettingsPageSkeleton,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { merchantId } = Route.useRouteContext();

	// merchantId is guaranteed by parent route redirect
	if (!merchantId) return null;

	return <SubscriptionSettingsPage merchantId={merchantId} />;
}
