import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCartStore } from "../../cart/stores/cart-store";
import { useShopOptional } from "../../shared/contexts/shop-context";

interface CartButtonProps {
	onClick: () => void;
}

function CartButton({ onClick }: CartButtonProps) {
	const { t } = useTranslation("shop");
	const itemCount = useCartStore((s) => s.itemCount);

	return (
		<Button
			variant="ghost"
			size="icon"
			className="relative text-foreground hover:bg-card"
			onClick={onClick}
			aria-label={t("header.cartWithItems", { count: itemCount })}
		>
			<ShoppingBag className="size-5" />
			{itemCount > 0 && (
				<span
					className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-xs font-medium"
					style={{
						backgroundColor: "var(--primary)",
						color: "var(--primary-foreground)",
					}}
				>
					{itemCount > 99 ? "99+" : itemCount}
				</span>
			)}
		</Button>
	);
}

function BackButton() {
	const { t } = useTranslation("shop");

	return (
		<Button
			variant="ghost"
			size="icon"
			className="text-foreground hover:bg-card"
			asChild
		>
			<Link to="/shop">
				<ArrowLeft className="size-5" />
				<span className="sr-only">{t("header.backToShop")}</span>
			</Link>
		</Button>
	);
}

export function ShopHeader() {
	const location = useLocation();
	const shop = useShopOptional();
	const isShopRoot =
		location.pathname === "/shop" || location.pathname === "/shop/";

	return (
		<header
			className={cn("sticky top-0 z-50 h-14 border-b backdrop-blur-md")}
			style={{
				backgroundColor: "oklch(0.988 0.003 90 / 0.9)",
				borderColor: "var(--border)",
			}}
		>
			<div className="flex h-full items-center justify-between px-4">
				{isShopRoot ? (
					<Link to="/shop" className="flex items-center">
						<img src="/menuvo-logo.svg" alt="Menuvo" className="h-7" />
					</Link>
				) : (
					<BackButton />
				)}

				<CartButton onClick={() => shop?.openCartDrawer()} />
			</div>
		</header>
	);
}
