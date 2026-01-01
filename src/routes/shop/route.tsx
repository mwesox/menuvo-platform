import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CartDrawer } from "@/features/shop/cart";
import { ShopFooter, ShopHeader } from "@/features/shop/layout";
import {
	CookieBanner,
	CookieConsentProvider,
	ShopProvider,
	useShop,
} from "@/features/shop/shared";
import shopCss from "@/styles/shop-bundle.css?url";

export const Route = createFileRoute("/shop")({
	head: () => ({
		links: [{ rel: "stylesheet", href: shopCss }],
	}),
	component: ShopLayout,
});

function ShopLayout() {
	return (
		<ShopProvider>
			<CookieConsentProvider>
				<ShopLayoutContent />
			</CookieConsentProvider>
		</ShopProvider>
	);
}

function ShopLayoutContent() {
	const { isCartDrawerOpen, closeCartDrawer } = useShop();

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<ShopHeader />
			<main className="flex-1">
				<Outlet />
			</main>
			<ShopFooter />
			<CookieBanner />
			<CartDrawer
				open={isCartDrawerOpen}
				onOpenChange={(open) => !open && closeCartDrawer()}
			/>
		</div>
	);
}
