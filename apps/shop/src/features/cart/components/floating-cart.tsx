import { Box, chakra, HStack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuShoppingCart } from "react-icons/lu";
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
		<chakra.button
			type="button"
			onClick={openCartDrawer}
			position="fixed"
			right="4"
			bottom="6"
			left="4"
			display={{ base: "flex", md: "none" }}
			bg="colorPalette.solid"
			color="colorPalette.contrast"
			colorPalette="teal"
			rounded="xl"
			px="5"
			py="4"
			shadow="xl"
			alignItems="center"
			justifyContent="space-between"
			zIndex="40"
			fontWeight="medium"
			transition="all"
			transitionDuration="300ms"
			_hover={{ transform: "translateY(-2px)", shadow: "2xl" }}
			_active={{ transform: "scale(0.98)" }}
			animation="slideInFromBottom 300ms ease-out"
			aria-label={t("cart.openCart", {
				count: itemCount,
				total: formatPrice(subtotal),
			})}
			css={{
				"@keyframes slideInFromBottom": {
					from: { transform: "translateY(16px)", opacity: 0 },
					to: { transform: "translateY(0)", opacity: 1 },
				},
			}}
		>
			{/* Left side - icon with badge + label */}
			<HStack gap="3">
				<Box position="relative">
					<Box as={LuShoppingCart} w="5" h="5" />
					{/* Item count badge */}
					<Box
						as="span"
						position="absolute"
						top="-2"
						right="-2"
						display="flex"
						alignItems="center"
						justifyContent="center"
						w="5"
						h="5"
						rounded="full"
						bg="bg"
						color="fg"
						fontWeight="bold"
						fontSize="xs"
						shadow="sm"
					>
						{itemCount}
					</Box>
				</Box>
				<Text as="span">{t("cart.viewCart")}</Text>
			</HStack>

			{/* Right side - total */}
			<Text
				as="span"
				fontWeight="semibold"
				textStyle="lg"
				fontVariantNumeric="tabular-nums"
			>
				{formatPrice(subtotal)}
			</Text>
		</chakra.button>
	);
}
