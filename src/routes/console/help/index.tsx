import { createFileRoute } from "@tanstack/react-router";
import { ConsoleError } from "@/features/console/components/console-error";
import { HelpPage } from "@/features/console/help";

export const Route = createFileRoute("/console/help/")({
	component: RouteComponent,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	return <HelpPage />;
}
