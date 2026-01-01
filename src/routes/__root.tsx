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
import { type AppTheme, detectThemeFromRequest } from "@/lib/theme";
import appCss from "../styles/base.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	language: SupportedLanguage;
	theme: AppTheme;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		const [language, theme] = await Promise.all([
			detectLanguageFromRequest(),
			detectThemeFromRequest(),
		]);
		return { language, theme };
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Menuvo Console",
			},
		],
		links: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Instrument+Serif:ital@0;1&display=swap",
			},
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),

	component: RootComponent,
});

function RootComponent() {
	const { language, theme } = Route.useRouteContext();
	const i18n = initI18n(language);

	return (
		<I18nextProvider i18n={i18n}>
			<html lang={i18n.language} data-theme={theme}>
				<head>
					<HeadContent />
				</head>
				<body className="min-h-screen bg-background font-sans antialiased">
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
