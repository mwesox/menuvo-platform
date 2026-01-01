import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CartProvider } from "@/features/shop/cart-context";
import { ShopHeader } from "@/features/shop/components/shop-header";

export const Route = createFileRoute("/shop")({
	component: ShopLayout,
});

function ShopLayout() {
	return (
		<CartProvider>
			<div
				className="shop min-h-screen"
				style={{
					backgroundColor: "var(--shop-background)",
					fontFamily: "var(--font-body)",
				}}
			>
				<ShopHeader />
				<main>
					<Outlet />
				</main>
			</div>
		</CartProvider>
	);
}
