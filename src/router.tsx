import * as Sentry from "@sentry/tanstackstart-react";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { DEFAULT_LANGUAGE } from "./i18n";
import * as TanstackQuery from "./lib/tanstack-query/root-provider";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
	const rqContext = TanstackQuery.getContext();

	const router = createRouter({
		routeTree,
		context: {
			...rqContext,
			language: DEFAULT_LANGUAGE,
		},
		defaultPreload: "intent",
		defaultPreloadDelay: 100, // Debounce hover prefetches
		defaultStaleTime: 5 * 60 * 1000, // 5 min - don't re-run loaders if route data is fresh
		defaultGcTime: 10 * 60 * 1000, // 10 min - keep route data in memory
		defaultNotFoundComponent: () => <div>Page not found</div>,
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient: rqContext.queryClient,
	});

	if (!router.isServer) {
		Sentry.init({
			dsn: import.meta.env.VITE_SENTRY_DSN,
			integrations: [],
			tracesSampleRate: 1.0,
			sendDefaultPii: true,
		});
	}

	return router;
};
