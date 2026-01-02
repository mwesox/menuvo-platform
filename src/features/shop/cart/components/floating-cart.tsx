"use client";

import { ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useShop } from "../../shared/contexts/shop-context";
import { formatPrice } from "../../utils";
import { useCartStore } from "../stores/cart-store";

/**
 * Mobile floating cart bar.
 * Full-width bottom bar visible on mobile when cart has items.
 * Opens CartDrawer on click (via ShopContext).
 */
export function FloatingCart() {
	const { t } = useTranslation("shop");
	const items = useCartStore((s) => s.items);
	// Compute from items (getters don't work with persist middleware)
	const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
	const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
	const { openCartDrawer } = useShop();

	// Don't render if cart is empty
	if (itemCount === 0) {
		return null;
	}

	return (
		<button
			type="button"
			onClick={openCartDrawer}
			className={cn(
				"fixed bottom-6 left-4 right-4 md:hidden",
				"bg-primary text-primary-foreground",
				"px-5 py-4 rounded-2xl shadow-xl",
				"flex items-center justify-between",
				"font-medium z-40",
				"transition-all duration-300",
				"hover:shadow-2xl hover:-translate-y-0.5",
				"active:scale-[0.98]",
				"animate-in slide-in-from-bottom-4 duration-300",
			)}
			aria-label={t("cart.openCart", {
				count: itemCount,
				total: formatPrice(subtotal),
			})}
		>
			{/* Left side - icon with badge + label */}
			<div className="flex items-center gap-3">
				<div className="relative">
					<ShoppingBag className="w-5 h-5" />
					{/* Item count badge */}
					<span className="absolute -top-2 -right-2 bg-background text-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
						{itemCount}
					</span>
				</div>
				<span>{t("cart.viewCart")}</span>
			</div>

			{/* Right side - total */}
			<span className="text-lg font-semibold tabular-nums">
				{formatPrice(subtotal)}
			</span>
		</button>
	);
}
