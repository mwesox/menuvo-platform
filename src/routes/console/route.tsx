import { createFileRoute } from "@tanstack/react-router";
import { ConsoleLayout } from "@/components/layout/console-layout";
import { storeQueries } from "@/features/console/stores/queries";
import consoleCss from "@/styles/console-bundle.css?url";

export const Route = createFileRoute("/console")({
	head: () => ({
		links: [{ rel: "stylesheet", href: consoleCss }],
	}),
	loader: async ({ context }) => {
		// Preload stores to prevent Suspense fallback on navigation
		await context.queryClient.ensureQueryData(storeQueries.list());
	},
	component: ConsoleLayout,
});
