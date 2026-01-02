import type { QueryClient } from "@tanstack/react-query";
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
import shopCss from "@/styles/shop-bundle.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	language: SupportedLanguage;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		const language = await detectLanguageFromRequest();
		return { language };
	},
	head: ({ matches }) => {
		// Determine which CSS bundle to load based on matched routes
		const isShopRoute = matches.some((m) => m.routeId.startsWith("/shop"));
		const isConsoleRoute = matches.some((m) =>
			m.routeId.startsWith("/console"),
		);
		const isBusinessRoute = matches.some((m) =>
			m.routeId.startsWith("/business"),
		);

		// Select CSS bundle and title based on route
		let cssHref: string;
		let title: string;

		if (isConsoleRoute) {
			cssHref = consoleCss;
			title = "Menuvo Console";
		} else if (isBusinessRoute) {
			cssHref = businessCss;
			title = "Menuvo";
		} else {
			// Default to shop (includes root "/" which redirects to /shop)
			cssHref = shopCss;
			title = "Menuvo";
		}

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
			links: [{ rel: "stylesheet", href: cssHref }],
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
