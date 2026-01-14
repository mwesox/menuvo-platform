import { createFileRoute } from "@tanstack/react-router";
import { ConsoleLayout } from "@/components/layout/console-layout";

export const Route = createFileRoute("/_app")({
	component: AppLayout,
});

function AppLayout() {
	return <ConsoleLayout />;
}
