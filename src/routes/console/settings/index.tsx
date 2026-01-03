import { createFileRoute } from "@tanstack/react-router";
import { ConsoleError } from "@/features/console/components/console-error";
import { SettingsHubPage } from "@/features/console/settings/components/settings-hub-page";
import { SettingsHubPageSkeleton } from "@/features/console/settings/components/skeletons";

export const Route = createFileRoute("/console/settings/")({
	component: RouteComponent,
	pendingComponent: SettingsHubPageSkeleton,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	return <SettingsHubPage />;
}
