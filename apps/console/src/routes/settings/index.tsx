import { createFileRoute } from "@tanstack/react-router";
import { ConsoleError } from "@/features/components/console-error";
import { SettingsHubPage } from "@/features/settings/components/settings-hub-page";
import { SettingsHubPageSkeleton } from "@/features/settings/components/skeletons";

export const Route = createFileRoute("/settings/")({
	component: RouteComponent,
	pendingComponent: SettingsHubPageSkeleton,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	return <SettingsHubPage />;
}
