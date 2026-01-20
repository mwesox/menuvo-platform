import { Button } from "@menuvo/ui/components/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@menuvo/ui/components/drawer";
import { useIsMobile } from "@menuvo/ui/hooks/use-media-query";
import { cn } from "@menuvo/ui/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useShopUIStore } from "../../shared";
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
	const isCartSidebarCollapsed = useShopUIStore(
		(s) => s.isCartSidebarCollapsed,
	);
	const toggleCartSidebar = useShopUIStore((s) => s.toggleCartSidebar);

	// Move focus to drawer when it opens (fixes aria-hidden accessibility issue)
	// This ensures focus is inside the drawer when vaul sets aria-hidden on root
	useEffect(() => {
		if (open && isMobile) {
			// Small delay to ensure drawer is fully rendered in DOM
			const timeoutId = setTimeout(() => {
				// Find the drawer content element (vaul renders it in a portal)
				const drawerContent = document.querySelector(
					'[data-slot="drawer-content"]',
				) as HTMLElement;
				if (drawerContent) {
					// Find first focusable element in drawer
					const firstFocusable = drawerContent.querySelector(
						'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
					) as HTMLElement;
					firstFocusable?.focus();
				}
			}, 150);
			return () => clearTimeout(timeoutId);
		}
	}, [open, isMobile]);

	const handleOrdering = () => {
		if (!storeSlug) return;
		onOpenChange(false);
		navigate({ to: "/$slug/ordering", params: { slug: storeSlug } });
	};

	// Mobile: Use Drawer component (existing behavior)
	if (isMobile) {
		return (
			<Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
				<DrawerContent className={cn("flex flex-col", "max-h-[85dvh]")}>
					<DrawerHeader className="border-border border-b pb-4 text-start">
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
					<div className="min-h-0 flex-1 overflow-y-auto px-4">
						{items.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-16 text-center">
								<ShoppingBag className="mb-4 size-16 text-border" />
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

					{/* Cart summary and ordering button */}
					{items.length > 0 && (
						<DrawerFooter className="border-border border-t bg-card pt-4">
							<CartSummary subtotal={subtotal} />
							<ShopButton
								variant="primary"
								size="lg"
								onClick={handleOrdering}
								className="w-full"
							>
								{t("cart.ordering")}
							</ShopButton>
						</DrawerFooter>
					)}
				</DrawerContent>
			</Drawer>
		);
	}

	// Desktop: Fixed sidebar - only show at lg (1024px+) to give tablets more content space
	return (
		<aside
			className={cn(
				"hidden lg:flex",
				"fixed top-14 right-0 bottom-0 z-40", // Fixed to viewport edges (acts as containing block for absolute children)
				"w-80 flex-col border-border border-l bg-background shadow-sm",
				"transition-transform duration-300 ease-in-out",
				"overflow-hidden",
				isCartSidebarCollapsed && "translate-x-full", // Slide out when collapsed
			)}
		>
			{/* Header - fixed at top */}
			<div className="shrink-0 border-border border-b pb-4 text-start">
				<div className="flex items-start justify-between gap-2 px-4 pt-4">
					<div className="flex-1">
						<ShopHeading as="h2" size="lg">
							{t("cart.title")}
						</ShopHeading>
						<p className="text-muted-foreground text-sm">
							{items.length === 0
								? t("cart.empty")
								: t("cart.itemCount", { count: itemCount })}
						</p>
					</div>
					{/* Collapse button */}
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleCartSidebar}
						className="h-8 w-8 shrink-0"
						aria-label={t("cart.collapseSidebar", "Collapse cart")}
					>
						<ChevronLeft className="size-4" />
					</Button>
				</div>
			</div>

			{/* Cart items - no internal scroll, overflow clipped */}
			<div
				className={cn(
					"min-h-0 flex-1 overflow-hidden px-4",
					items.length > 0 && "pb-40",
				)}
			>
				{items.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<ShoppingBag className="mb-4 size-16 text-border" />
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

			{/* Footer - absolute positioned at bottom for sticky CTA */}
			{items.length > 0 && (
				<div className="absolute inset-x-0 bottom-0 border-border border-t bg-card">
					<div className="px-4 py-4">
						<CartSummary subtotal={subtotal} />
						<ShopButton
							variant="primary"
							size="lg"
							onClick={handleOrdering}
							className="mt-4 w-full"
						>
							{t("cart.ordering")}
						</ShopButton>
					</div>
				</div>
			)}
		</aside>
	);
}
