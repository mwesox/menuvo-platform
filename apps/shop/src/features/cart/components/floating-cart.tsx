import { cn } from "@menuvo/ui/lib/utils";
import { ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useShopUIStore } from "../../shared";
import { formatPrice } from "../../utils";
import { useCartStore } from "../stores/cart-store";

/**
 * Mobile floating cart bar.
 * Full-width bottom bar visible on mobile when cart has items.
 * Opens CartDrawer on click (via Zustand store).
 */
export function FloatingCart() {
	const { t } = useTranslation("shop");
	const items = useCartStore((s) => s.items);
	// Compute from items (getters don't work with persist middleware)
	const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
	const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
	const openCartDrawer = useShopUIStore((s) => s.openCartDrawer);

	// Don't render if cart is empty
	if (itemCount === 0) {
		return null;
	}

	return (
		<button
			type="button"
			onClick={openCartDrawer}
			className={cn(
				"fixed right-4 bottom-6 left-4 md:hidden",
				"bg-primary text-primary-foreground",
				"rounded-2xl px-5 py-4 shadow-xl",
				"flex items-center justify-between",
				"z-40 font-medium",
				"transition-all duration-300",
				"hover:-translate-y-0.5 hover:shadow-2xl",
				"active:scale-[0.98]",
				"slide-in-from-bottom-4 animate-in duration-300",
			)}
			aria-label={t("cart.openCart", {
				count: itemCount,
				total: formatPrice(subtotal),
			})}
		>
			{/* Left side - icon with badge + label */}
			<div className="flex items-center gap-3">
				<div className="relative">
					<ShoppingCart className="size-5" />
					{/* Item count badge */}
					<span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-background font-bold text-foreground text-xs shadow-sm">
						{itemCount}
					</span>
				</div>
				<span>{t("cart.viewCart")}</span>
			</div>

			{/* Right side - total */}
			<span className="font-semibold text-lg tabular-nums">
				{formatPrice(subtotal)}
			</span>
		</button>
	);
}
