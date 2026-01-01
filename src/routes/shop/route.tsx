import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CartProvider } from "@/features/shop/cart-context";
import { CartDrawer } from "@/features/shop/components/cart-drawer";
import { CookieBanner } from "@/features/shop/components/cookie-banner";
import { ShopFooter } from "@/features/shop/components/shop-footer";
import { ShopHeader } from "@/features/shop/components/shop-header";
import { CookieConsentProvider } from "@/features/shop/contexts/cookie-consent-context";
import { ShopProvider, useShop } from "@/features/shop/contexts/shop-context";

export const Route = createFileRoute("/shop")({
	component: ShopLayout,
});

function ShopLayout() {
	return (
		<ShopProvider>
			<CookieConsentProvider>
				<CartProvider>
					<ShopLayoutContent />
				</CartProvider>
			</CookieConsentProvider>
		</ShopProvider>
	);
}

function ShopLayoutContent() {
	const { isCartDrawerOpen, closeCartDrawer } = useShop();

	return (
		<div className="flex min-h-screen flex-col bg-background font-body">
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
