import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import { Provider } from "@/components/ui/provider";
import { i18n, initI18n } from "./i18n";
import { queryClient, TRPCProvider, trpcClient } from "./lib/trpc";
import { routeTree } from "./routeTree.gen";
import "./index.css";

// Initialize i18n early to ensure it's ready for error components
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
		<Provider>
			<QueryClientProvider client={queryClient}>
				<TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
					<I18nextProvider i18n={i18n}>
						<RouterProvider router={router} />
					</I18nextProvider>
				</TRPCProvider>
			</QueryClientProvider>
		</Provider>
	);
}

// Render app
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

// Extend HTMLElement to support HMR root caching
interface RootElement extends HTMLElement {
	__reactRoot?: ReturnType<typeof createRoot>;
}

// Prevent double render in HMR
let root = (rootElement as RootElement).__reactRoot;
if (!root) {
	root = createRoot(rootElement);
	(rootElement as RootElement).__reactRoot = root;
}

root.render(
	<StrictMode>
		<App />
	</StrictMode>,
);
