"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "../cart-context";
import { useShop } from "../contexts/shop-context";
import { formatPrice } from "../utils";

/**
 * Mobile floating action button for cart.
 * Only visible on mobile devices when cart has items.
 * Opens CartDrawer on click (via ShopContext).
 */
export function FloatingCart() {
	const { itemCount, subtotal } = useCart();
	const { openCartDrawer } = useShop();

	// Don't render if cart is empty
	if (itemCount === 0) {
		return null;
	}

	return (
		<button
			type="button"
			onClick={openCartDrawer}
			className="fixed bottom-6 right-4 md:hidden bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg flex items-center gap-2 font-medium z-40 transition-transform hover:scale-105 active:scale-95 animate-in zoom-in-75 duration-200"
			aria-label={`Open cart with ${itemCount} items totaling ${formatPrice(subtotal)}`}
		>
			<ShoppingBag className="w-5 h-5" />
			<span className="tabular-nums transition-transform">{itemCount}</span>
			<span className="text-primary-foreground/70">|</span>
			<span className="tabular-nums transition-transform">
				{formatPrice(subtotal)}
			</span>
		</button>
	);
}
