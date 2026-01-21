import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ConsoleError } from "@/features/components/console-error";

export const Route = createFileRoute("/_app/stores/$storeId/service-points")({
	component: ServicePointsLayout,
	errorComponent: ConsoleError,
});

function ServicePointsLayout() {
	return <Outlet />;
}
