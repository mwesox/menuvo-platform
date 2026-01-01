import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useCartOptional } from "@/features/shop/cart-context";
import { cn } from "@/lib/utils";

/**
 * Format price from cents to display string
 */
function formatPrice(cents: number): string {
	return `$${(cents / 100).toFixed(2)}`;
}

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
			className="relative text-shop-foreground hover:bg-shop-card"
			onClick={onClick}
			aria-label={`Shopping cart with ${itemCount} items`}
		>
			<ShoppingBag className="size-5" />
			{itemCount > 0 && (
				<span
					className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-xs font-medium"
					style={{
						backgroundColor: "var(--shop-accent)",
						color: "var(--shop-accent-foreground)",
					}}
				>
					{itemCount > 99 ? "99+" : itemCount}
				</span>
			)}
		</Button>
	);
}

interface CartSheetProps {
	isOpen: boolean;
	onClose: () => void;
}

function CartSheet({ isOpen, onClose }: CartSheetProps) {
	const cart = useCartOptional();

	if (!cart) return null;

	const { items, subtotal, updateQuantity, removeItem } = cart;

	return (
		<Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<SheetContent
				side="right"
				className="flex flex-col"
				style={{
					backgroundColor: "var(--shop-background)",
					fontFamily: "var(--font-body)",
				}}
			>
				<SheetHeader>
					<SheetTitle
						className="text-shop-foreground"
						style={{ fontFamily: "var(--font-heading)" }}
					>
						Your Cart
					</SheetTitle>
					<SheetDescription className="text-shop-foreground-muted">
						{items.length === 0
							? "Your cart is empty"
							: `${items.length} item${items.length === 1 ? "" : "s"} in your cart`}
					</SheetDescription>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto py-4">
					{items.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center gap-4 text-shop-foreground-muted">
							<ShoppingBag className="size-12 opacity-50" />
							<p>Add items to get started</p>
						</div>
					) : (
						<ul className="space-y-4">
							{items.map((item) => (
								<li
									key={item.id}
									className="flex gap-3 rounded-lg border p-3"
									style={{
										backgroundColor: "var(--shop-card)",
										borderColor: "var(--shop-border)",
									}}
								>
									{item.imageUrl && (
										<div
											className="size-16 flex-shrink-0 overflow-hidden rounded-md"
											style={{
												backgroundColor: "var(--shop-background-subtle)",
											}}
										>
											<img
												src={item.imageUrl}
												alt={item.name}
												className="size-full object-cover"
											/>
										</div>
									)}
									<div className="flex flex-1 flex-col">
										<span
											className="font-medium text-shop-foreground"
											style={{ fontFamily: "var(--font-heading)" }}
										>
											{item.name}
										</span>
										<span className="text-sm text-shop-foreground-muted">
											{formatPrice(item.totalPrice)}
										</span>
										{item.selectedOptions.length > 0 && (
											<span className="mt-0.5 text-xs text-shop-foreground-muted">
												{item.selectedOptions
													.flatMap((g) => g.choices.map((c) => c.name))
													.join(", ")}
											</span>
										)}
										<div className="mt-2 flex items-center gap-2">
											<Button
												variant="outline"
												size="icon-sm"
												className="size-7"
												onClick={() =>
													updateQuantity(item.id, item.quantity - 1)
												}
												aria-label="Decrease quantity"
											>
												<Minus className="size-3" />
											</Button>
											<span className="w-8 text-center text-sm text-shop-foreground">
												{item.quantity}
											</span>
											<Button
												variant="outline"
												size="icon-sm"
												className="size-7"
												onClick={() =>
													updateQuantity(item.id, item.quantity + 1)
												}
												aria-label="Increase quantity"
											>
												<Plus className="size-3" />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												className="ml-auto size-7 text-destructive hover:text-destructive"
												onClick={() => removeItem(item.id)}
												aria-label="Remove item"
											>
												<Trash2 className="size-3" />
											</Button>
										</div>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>

				{items.length > 0 && (
					<SheetFooter
						className="border-t pt-4"
						style={{ borderColor: "var(--shop-border)" }}
					>
						<div className="w-full space-y-4">
							<div className="flex items-center justify-between text-shop-foreground">
								<span className="text-shop-foreground-muted">Subtotal</span>
								<span
									className="text-lg font-semibold"
									style={{ fontFamily: "var(--font-heading)" }}
								>
									{formatPrice(subtotal)}
								</span>
							</div>
							<Button
								className="w-full"
								size="lg"
								style={{
									backgroundColor: "var(--shop-accent)",
									color: "var(--shop-accent-foreground)",
								}}
							>
								Checkout
							</Button>
						</div>
					</SheetFooter>
				)}
			</SheetContent>
		</Sheet>
	);
}

export function ShopHeader() {
	const location = useLocation();
	const [isCartOpen, setIsCartOpen] = useState(false);
	const isShopRoot =
		location.pathname === "/shop" || location.pathname === "/shop/";

	return (
		<>
			<header
				className={cn("sticky top-0 z-50 h-14 border-b backdrop-blur-md")}
				style={{
					backgroundColor: "oklch(0.988 0.003 90 / 0.9)",
					borderColor: "var(--shop-border)",
				}}
			>
				<div className="flex h-full items-center justify-between px-4">
					{isShopRoot ? (
						<Link to="/shop" className="flex items-center">
							<img src="/menuvo-logo-dark.svg" alt="Menuvo" className="h-7" />
						</Link>
					) : (
						<Button
							variant="ghost"
							size="icon"
							className="text-shop-foreground hover:bg-shop-card"
							asChild
						>
							<Link to="/shop">
								<ArrowLeft className="size-5" />
								<span className="sr-only">Back to shop</span>
							</Link>
						</Button>
					)}

					<CartButton onClick={() => setIsCartOpen(true)} />
				</div>
			</header>
			<CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
		</>
	);
}
