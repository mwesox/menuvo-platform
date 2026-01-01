"use client";

import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useCartOptional } from "../cart-context";
import { CartItem } from "./cart-item";
import { CartSummary } from "./cart-summary";
import { ShopButton, ShopHeading, ShopMutedText } from "./ui";

interface CartDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
	const cart = useCartOptional();

	if (!cart) return null;

	const { items, itemCount, subtotal, updateQuantity, removeItem } = cart;

	const handleCheckout = () => {
		toast.info("Checkout coming soon!", {
			description: "Stripe integration will be added in a future update.",
		});
	};

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent className="max-h-[85dvh] flex flex-col">
				<DrawerHeader className="border-b border-border pb-4 text-left">
					<DrawerTitle asChild>
						<ShopHeading as="h2" size="lg">
							Your Cart
						</ShopHeading>
					</DrawerTitle>
					<DrawerDescription className="text-muted-foreground">
						{items.length === 0
							? "Your cart is empty"
							: `${itemCount} item${itemCount === 1 ? "" : "s"} in your cart`}
					</DrawerDescription>
				</DrawerHeader>

				{/* Scrollable cart items */}
				<div className="flex-1 overflow-y-auto px-4">
					{items.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center">
							<ShoppingBag className="w-16 h-16 text-border mb-4" />
							<ShopHeading as="h3" size="lg" className="mb-1">
								Your cart is empty
							</ShopHeading>
							<ShopMutedText>
								Add some delicious items to get started
							</ShopMutedText>
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
					<DrawerFooter className="border-t border-border pt-4 bg-card">
						<CartSummary subtotal={subtotal} />
						<ShopButton
							variant="primary"
							size="lg"
							onClick={handleCheckout}
							className="w-full"
						>
							Checkout
						</ShopButton>
					</DrawerFooter>
				)}
			</DrawerContent>
		</Drawer>
	);
}
