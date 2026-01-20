import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { i18n, initI18n } from "./i18n";
import { queryClient, TRPCProvider, trpcClient } from "./lib/trpc";
import { routeTree } from "./routeTree.gen";
import "./index.css";

// Initialize i18n before rendering
initI18n();

// Create router
const router = createRouter({
	routeTree,
	context: {
		queryClient,
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
	return (
		<QueryClientProvider client={queryClient}>
			<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
				<I18nextProvider i18n={i18n}>
					<RouterProvider router={router} />
				</I18nextProvider>
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
