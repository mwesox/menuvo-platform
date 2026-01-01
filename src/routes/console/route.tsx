import { createFileRoute } from "@tanstack/react-router";
import { ConsoleLayout } from "@/components/layout/console-layout";
import consoleCss from "@/styles/console-bundle.css?url";

export const Route = createFileRoute("/console")({
	head: () => ({
		links: [{ rel: "stylesheet", href: consoleCss }],
	}),
	component: ConsoleLayout,
});
