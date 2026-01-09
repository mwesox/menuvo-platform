import { createFileRoute } from "@tanstack/react-router";
import { ConsoleError } from "@/features/components/console-error";
import { SubscriptionSettingsPageSkeleton } from "@/features/settings/components/skeletons";
import { SubscriptionSettingsPage } from "@/features/settings/components/subscription/subscription-settings-page";

export const Route = createFileRoute("/settings/subscription")({
	component: RouteComponent,
	pendingComponent: SubscriptionSettingsPageSkeleton,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	return <SubscriptionSettingsPage />;
}
