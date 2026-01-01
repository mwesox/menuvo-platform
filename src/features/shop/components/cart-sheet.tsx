"use client";

import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "../cart-context";
import { CartItem } from "./cart-item";
import { CartSummary } from "./cart-summary";

interface CartSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
	const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();

	const handleCheckout = () => {
		toast.info("Checkout coming soon!", {
			description: "Stripe integration will be added in a future update.",
		});
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="flex flex-col w-full sm:max-w-md"
				style={{
					backgroundColor: "var(--shop-background)",
					fontFamily: "var(--font-body)",
				}}
			>
				<SheetHeader className="border-b border-shop-border pb-4">
					<SheetTitle
						className="text-shop-foreground text-xl"
						style={{ fontFamily: "var(--font-heading)" }}
					>
						Your Order
					</SheetTitle>
					<SheetDescription className="text-shop-foreground-muted">
						{items.length === 0
							? "Your cart is empty"
							: `${itemCount} item${itemCount === 1 ? "" : "s"} in your order`}
					</SheetDescription>
				</SheetHeader>

				{/* Scrollable cart items */}
				<div className="flex-1 overflow-y-auto py-2 -mx-4 px-4">
					{items.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center">
							<ShoppingBag className="w-16 h-16 text-shop-border mb-4" />
							<h3
								style={{ fontFamily: "var(--font-heading)" }}
								className="text-xl text-shop-foreground mb-1"
							>
								Your cart is empty
							</h3>
							<p className="text-shop-foreground-muted">
								Add some delicious items to get started
							</p>
						</div>
					) : (
						<div>
							{items.map((item) => (
								<CartItem
									key={item.id}
									item={item}
									onQuantityChange={(quantity) =>
										updateQuantity(item.id, quantity)
									}
									onRemove={() => removeItem(item.id)}
								/>
							))}
						</div>
					)}
				</div>

				{/* Cart summary and checkout button */}
				{items.length > 0 && (
					<SheetFooter className="flex-col gap-4 border-t border-shop-border pt-4 sm:flex-col">
						<CartSummary subtotal={subtotal} />
						<Button
							onClick={handleCheckout}
							className="w-full"
							size="lg"
							style={{
								backgroundColor: "var(--shop-accent)",
								color: "var(--shop-accent-foreground)",
							}}
						>
							Continue to Checkout
						</Button>
					</SheetFooter>
				)}
			</SheetContent>
		</Sheet>
	);
}
