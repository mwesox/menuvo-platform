import { createFileRoute } from "@tanstack/react-router";
import { ConsoleError } from "@/features/components/console-error";
import { HelpPage } from "@/features/help";

export const Route = createFileRoute("/_app/help/")({
	component: RouteComponent,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	return <HelpPage />;
}
