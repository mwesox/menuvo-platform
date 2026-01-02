import { createFileRoute } from "@tanstack/react-router";
import { requireMerchant } from "@/features/console/auth/server/merchant.functions";
import { SettingsHubPage } from "@/features/console/settings/components/settings-hub-page";

export const Route = createFileRoute("/console/settings/")({
	beforeLoad: async () => requireMerchant(),
	component: RouteComponent,
});

function RouteComponent() {
	return <SettingsHubPage />;
}
