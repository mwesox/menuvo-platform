import { type QueryClient, queryOptions } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { I18nextProvider } from "react-i18next";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { initI18n, type SupportedLanguage } from "@/i18n";
import { detectLanguageFromRequest } from "@/i18n/server";
import businessCss from "@/styles/business-bundle.css?url";
import consoleCss from "@/styles/console-bundle.css?url";
import discoveryCss from "@/styles/discovery-bundle.css?url";
import shopCss from "@/styles/shop-bundle.css?url";

// Nunito font for console theme (warm, friendly)
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/500.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";

const languageQuery = queryOptions({
	queryKey: ["language"],
	queryFn: () => detectLanguageFromRequest(),
	staleTime: Number.POSITIVE_INFINITY, // Never refetch - language won't change during session
});

interface MyRouterContext {
	queryClient: QueryClient;
	language: SupportedLanguage;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async ({ context }) => {
		const language = await context.queryClient.ensureQueryData(languageQuery);
		return { language };
	},
	head: ({ matches }) => {
		// Determine which CSS bundle to load based on matched routes
		// Cast routeId to string for comparison (TypeScript is overly strict here)
		const isConsoleRoute = matches.some((m) => {
			const routeId = m.routeId as string;
			return (
				routeId.startsWith("/console") ||
				routeId.startsWith("/onboarding") ||
				routeId.startsWith("/auth")
			);
		});
		const isBusinessRoute = matches.some((m) =>
			(m.routeId as string).startsWith("/business"),
		);
		// Store routes: /$slug and its children
		const isStoreRoute = matches.some((m) => {
			const routeId = m.routeId as string;
			return routeId === "/$slug" || routeId.startsWith("/$slug/");
		});

		// Select CSS bundle and title based on route
		let cssHref: string;
		let title: string;

		if (isConsoleRoute) {
			cssHref = consoleCss;
			title = "Menuvo Console";
		} else if (isBusinessRoute) {
			cssHref = businessCss;
			title = "Menuvo";
		} else if (isStoreRoute) {
			// Store pages use shop CSS
			cssHref = shopCss;
			title = "Menuvo";
		} else {
			// Root/discovery page
			cssHref = discoveryCss;
			title = "Menuvo";
		}

		// Only load the active theme's CSS bundle
		const links: Array<{ rel: string; href: string }> = [
			{ rel: "stylesheet", href: cssHref },
		];

		// Inline critical CSS to prevent flash of unstyled content
		// Sets background/foreground immediately before full CSS loads
		const criticalCss = isConsoleRoute
			? `:root{--background:oklch(0.985 0.002 90);--foreground:oklch(0.205 0.02 240)}body{background:var(--background);color:var(--foreground)}`
			: isBusinessRoute
				? `:root{--background:oklch(0.985 0.008 85);--foreground:oklch(0.18 0.02 60)}body{background:var(--background);color:var(--foreground)}`
				: isStoreRoute
					? `:root{--background:oklch(0.985 0.005 60);--foreground:oklch(0.25 0.02 60)}body{background:var(--background);color:var(--foreground)}`
					: `:root{--background:oklch(0.985 0.008 85);--foreground:oklch(0.18 0.02 60)}body{background:var(--background);color:var(--foreground)}`;

		return {
			meta: [
				{
					charSet: "utf-8",
				},
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{
					title,
				},
			],
			links,
			styles: [{ children: criticalCss }],
		};
	},

	component: RootComponent,
});

function RootComponent() {
	const { language } = Route.useRouteContext();
	const i18n = initI18n(language);

	return (
		<I18nextProvider i18n={i18n}>
			<html lang={i18n.language} suppressHydrationWarning>
				<head>
					<HeadContent />
				</head>
				<body className="min-h-screen antialiased">
					<Providers>
						<Outlet />
						<Toaster />
					</Providers>
					<Scripts />
				</body>
			</html>
		</I18nextProvider>
	);
}
