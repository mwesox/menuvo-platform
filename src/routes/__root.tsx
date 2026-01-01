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

interface MyRouterContext {
	queryClient: QueryClient;
	language: SupportedLanguage;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		const language = await detectLanguageFromRequest();
		return { language };
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
		links: [],
	}),

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
