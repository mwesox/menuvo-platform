import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartOptional } from "@/features/shop/cart-context";
import { useShopOptional } from "@/features/shop/contexts/shop-context";
import { cn } from "@/lib/utils";

interface CartButtonProps {
	onClick: () => void;
}

function CartButton({ onClick }: CartButtonProps) {
	const cart = useCartOptional();
	const itemCount = cart?.itemCount ?? 0;

	return (
		<Button
			variant="ghost"
			size="icon"
			className="relative text-foreground hover:bg-card"
			onClick={onClick}
			aria-label={`Shopping cart with ${itemCount} items`}
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
					<div className="flex items-center gap-3">
						<Button
							variant="ghost"
							size="icon"
							className="text-foreground hover:bg-card"
							asChild
						>
							<Link to="/shop">
								<ArrowLeft className="size-5" />
								<span className="sr-only">Back to shop</span>
							</Link>
						</Button>
						{shop?.storeName && (
							<span
								className="max-w-[200px] truncate font-medium text-foreground"
								style={{ fontFamily: "var(--font-heading)" }}
							>
								{shop.storeName}
							</span>
						)}
					</div>
				)}

				<CartButton onClick={() => shop?.openCartDrawer()} />
			</div>
		</header>
	);
}
