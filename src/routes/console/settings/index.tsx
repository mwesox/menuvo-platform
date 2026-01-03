import { createFileRoute } from "@tanstack/react-router";
import { SettingsHubPage } from "@/features/console/settings/components/settings-hub-page";

export const Route = createFileRoute("/console/settings/")({
	component: RouteComponent,
});

function RouteComponent() {
	return <SettingsHubPage />;
}
