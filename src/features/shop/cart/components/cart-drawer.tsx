"use client";

import { useNavigate } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import {
	ShopButton,
	ShopHeading,
	ShopMutedText,
} from "../../shared/components/ui";
import { useCartStore } from "../stores/cart-store";
import { CartItem } from "./cart-item";
import { CartSummary } from "./cart-summary";

interface CartDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
	const { t } = useTranslation("shop");
	const navigate = useNavigate();
	const isMobile = useIsMobile();
	const items = useCartStore((s) => s.items);
	const storeSlug = useCartStore((s) => s.storeSlug);
	// Compute from items (getters don't work with persist middleware)
	const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
	const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
	const updateQuantity = useCartStore((s) => s.updateQuantity);
	const removeItem = useCartStore((s) => s.removeItem);

	const handleCheckout = () => {
		if (!storeSlug) return;
		onOpenChange(false);
		navigate({ to: "/$slug/checkout", params: { slug: storeSlug } });
	};

	return (
		<Drawer
			open={open}
			onOpenChange={onOpenChange}
			direction={isMobile ? "bottom" : "right"}
		>
			<DrawerContent
				className={cn(
					"flex flex-col",
					isMobile ? "max-h-[85dvh]" : "h-full w-full max-w-md",
				)}
			>
				<DrawerHeader className="border-b border-border pb-4 text-left">
					<DrawerTitle asChild>
						<ShopHeading as="h2" size="lg">
							{t("cart.title")}
						</ShopHeading>
					</DrawerTitle>
					<DrawerDescription className="text-muted-foreground">
						{items.length === 0
							? t("cart.empty")
							: t("cart.itemCount", { count: itemCount })}
					</DrawerDescription>
				</DrawerHeader>

				{/* Scrollable cart items */}
				<div className="flex-1 overflow-y-auto px-4">
					{items.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-16 text-center">
							<ShoppingBag className="w-16 h-16 text-border mb-4" />
							<ShopHeading as="h3" size="lg" className="mb-1">
								{t("cart.emptyTitle")}
							</ShopHeading>
							<ShopMutedText>{t("cart.emptyDescription")}</ShopMutedText>
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
							{t("cart.checkout")}
						</ShopButton>
					</DrawerFooter>
				)}
			</DrawerContent>
		</Drawer>
	);
}
