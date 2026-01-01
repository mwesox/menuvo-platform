"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "../cart-context";
import { formatPrice } from "../utils";
import { CartSheet } from "./cart-sheet";

/**
 * Mobile floating action button for cart.
 * Only visible on mobile devices when cart has items.
 * Opens CartSheet on click.
 */
export function FloatingCart() {
	const { itemCount, subtotal } = useCart();
	const [isCartOpen, setIsCartOpen] = useState(false);

	// Don't render if cart is empty
	if (itemCount === 0) {
		return null;
	}

	return (
		<>
			<button
				type="button"
				onClick={() => setIsCartOpen(true)}
				className="fixed bottom-6 right-4 md:hidden bg-shop-accent text-shop-accent-foreground px-5 py-3 rounded-full shadow-lg flex items-center gap-2 font-medium z-40 transition-transform hover:scale-105 active:scale-95 animate-in zoom-in-75 duration-200"
				aria-label={`Open cart with ${itemCount} items totaling ${formatPrice(subtotal)}`}
			>
				<ShoppingBag className="w-5 h-5" />
				<span className="tabular-nums transition-transform">{itemCount}</span>
				<span className="text-shop-accent-foreground/70">|</span>
				<span className="tabular-nums transition-transform">
					{formatPrice(subtotal)}
				</span>
			</button>

			<CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
		</>
	);
}
