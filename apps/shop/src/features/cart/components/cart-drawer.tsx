import {
	Box,
	CloseButton,
	Drawer,
	Flex,
	IconButton,
	Portal,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuChevronLeft, LuShoppingBag } from "react-icons/lu";
import { useShopUIStore } from "../../shared";
import {
	EmptyState,
	ShopButton,
	ShopHeading,
} from "../../shared/components/ui";
import { useCartStore } from "../stores/cart-store";
import { CartItem } from "./cart-item";
import { CartSummary } from "./cart-summary";

interface CartDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/** Simple mobile detection hook */
function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	return isMobile;
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

	const handleOrdering = () => {
		if (!storeSlug) return;
		onOpenChange(false);
		navigate({ to: "/$slug/ordering", params: { slug: storeSlug } });
	};

	// Mobile: Use Chakra Drawer component
	if (isMobile) {
		return (
			<Drawer.Root
				open={open}
				onOpenChange={(e) => onOpenChange(e.open)}
				placement="bottom"
			>
				<Portal>
					<Drawer.Backdrop />
					<Drawer.Positioner>
						<Drawer.Content
							maxH="85dvh"
							roundedTop="xl"
							display="flex"
							flexDirection="column"
						>
							<Drawer.Header
								borderBottomWidth="1px"
								borderColor="border"
								pb="4"
								textAlign="start"
							>
								<Drawer.Title asChild>
									<ShopHeading as="h2" size="lg">
										{t("cart.title")}
									</ShopHeading>
								</Drawer.Title>
								<Drawer.Description color="fg.muted">
									{items.length === 0
										? t("cart.empty")
										: t("cart.itemCount", { count: itemCount })}
								</Drawer.Description>
								<Drawer.CloseTrigger
									asChild
									position="absolute"
									top="2"
									right="2"
								>
									<CloseButton size="sm" />
								</Drawer.CloseTrigger>
							</Drawer.Header>

							{/* Scrollable cart items */}
							<Drawer.Body minH="0" flex="1" overflowY="auto" px="4">
								{items.length === 0 ? (
									<EmptyState
										variant="inline"
										icon={LuShoppingBag}
										title={t("cart.emptyTitle")}
										description={t("cart.emptyDescription")}
									/>
								) : (
									<Box>
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
									</Box>
								)}
							</Drawer.Body>

							{/* Cart summary and ordering button */}
							{items.length > 0 && (
								<Drawer.Footer
									borderTopWidth="1px"
									borderColor="border"
									bg="bg.panel"
									pt="4"
								>
									<VStack gap="4" w="full">
										<CartSummary subtotal={subtotal} />
										<ShopButton
											variant="primary"
											size="lg"
											onClick={handleOrdering}
											w="full"
										>
											{t("cart.ordering")}
										</ShopButton>
									</VStack>
								</Drawer.Footer>
							)}
						</Drawer.Content>
					</Drawer.Positioner>
				</Portal>
			</Drawer.Root>
		);
	}

	// Desktop: Fixed sidebar - only show at lg (1024px+) to give tablets more content space
	return (
		<Box
			as="aside"
			display={{ base: "none", lg: "flex" }}
			position="fixed"
			top="14"
			right="0"
			bottom="0"
			zIndex="40"
			w="80"
			flexDirection="column"
			borderLeftWidth="1px"
			borderColor="border"
			bg="bg"
			shadow="sm"
			transition="transform"
			transitionDuration="300ms"
			transitionTimingFunction="ease-in-out"
			overflow="hidden"
			transform={isCartSidebarCollapsed ? "translateX(100%)" : "translateX(0)"}
		>
			{/* Header - fixed at top */}
			<Box
				flexShrink="0"
				borderBottomWidth="1px"
				borderColor="border"
				pb="4"
				textAlign="start"
			>
				<Flex align="start" justify="space-between" gap="2" px="4" pt="4">
					<Box flex="1">
						<ShopHeading as="h2" size="lg">
							{t("cart.title")}
						</ShopHeading>
						<Text color="fg.muted" textStyle="sm">
							{items.length === 0
								? t("cart.empty")
								: t("cart.itemCount", { count: itemCount })}
						</Text>
					</Box>
					{/* Collapse button */}
					<IconButton
						variant="ghost"
						size="sm"
						onClick={toggleCartSidebar}
						h="8"
						w="8"
						flexShrink="0"
						aria-label={t("cart.collapseSidebar", "Collapse cart")}
					>
						<LuChevronLeft />
					</IconButton>
				</Flex>
			</Box>

			{/* Cart items - no internal scroll, overflow clipped */}
			<Box
				minH="0"
				flex="1"
				overflow="hidden"
				px="4"
				pb={items.length > 0 ? "40" : "0"}
			>
				{items.length === 0 ? (
					<EmptyState
						variant="inline"
						icon={LuShoppingBag}
						title={t("cart.emptyTitle")}
						description={t("cart.emptyDescription")}
					/>
				) : (
					<Box>
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
					</Box>
				)}
			</Box>

			{/* Footer - absolute positioned at bottom for sticky CTA */}
			{items.length > 0 && (
				<Box
					position="absolute"
					left="0"
					right="0"
					bottom="0"
					borderTopWidth="1px"
					borderColor="border"
					bg="bg.panel"
				>
					<Box px="4" py="4">
						<CartSummary subtotal={subtotal} />
						<ShopButton
							variant="primary"
							size="lg"
							onClick={handleOrdering}
							mt="4"
							w="full"
						>
							{t("cart.ordering")}
						</ShopButton>
					</Box>
				</Box>
			)}
		</Box>
	);
}
