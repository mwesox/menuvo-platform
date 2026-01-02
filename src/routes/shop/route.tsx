import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CookieBanner, CookieConsentProvider } from "@/features/shop/shared";

export const Route = createFileRoute("/shop")({
	component: ShopLayout,
});

function ShopLayout() {
	return (
		<CookieConsentProvider>
			<div className="flex min-h-screen flex-col bg-background">
				<Outlet />
			</div>
			<CookieBanner />
		</CookieConsentProvider>
	);
}
