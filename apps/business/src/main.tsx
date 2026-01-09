import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
	createTRPCReactClient,
	getQueryClient,
	TRPCProvider,
	trpcClient,
} from "./lib/trpc";
import { routeTree } from "./routeTree.gen";
import "./index.css";

// Create router
const router = createRouter({
	routeTree,
	context: {
		queryClient: getQueryClient(),
		trpcClient,
	},
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
});

// Register router for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

function App() {
	const queryClient = getQueryClient();
	const [trpcReactClient] = useState(() => createTRPCReactClient());

	return (
		<QueryClientProvider client={queryClient}>
			<TRPCProvider trpcClient={trpcReactClient} queryClient={queryClient}>
				<RouterProvider router={router} />
			</TRPCProvider>
		</QueryClientProvider>
	);
}

// Render app
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
