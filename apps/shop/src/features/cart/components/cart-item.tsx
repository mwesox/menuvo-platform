import { Box, Flex, HStack, IconButton, Image } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuX } from "react-icons/lu";
import {
	QuantityStepper,
	ShopHeading,
	ShopMutedText,
	ShopPrice,
} from "../../shared";
import type { CartItem as CartItemType } from "../stores/cart-store";

interface CartItemProps {
	item: CartItemType;
	onQuantityChange: (quantity: number) => void;
	onRemove: () => void;
}

export function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
	const { t } = useTranslation("shop");
	// Format selected options as comma-separated list
	const optionsText = item.selectedOptions
		.flatMap((group) => group.choices.map((choice) => choice.name))
		.join(", ");

	return (
		<HStack
			gap="3"
			borderBottomWidth="1px"
			borderColor="border/50"
			py="4"
			align="center"
		>
			{/* Item image - centered vertically */}
			<Box
				w="14"
				h="14"
				flexShrink="0"
				overflow="hidden"
				rounded="lg"
				bg="bg.muted"
			>
				{item.imageUrl && (
					<Image
						src={item.imageUrl}
						alt={item.name}
						w="full"
						h="full"
						objectFit="cover"
					/>
				)}
			</Box>

			{/* Item details - name and quantity */}
			<Box minW="0" flex="1">
				<ShopHeading as="h3" size="sm" truncate fontWeight="normal">
					{item.name}
				</ShopHeading>
				{optionsText && (
					<ShopMutedText truncate textStyle="sm">
						{optionsText}
					</ShopMutedText>
				)}
				<Box mt="1.5">
					<QuantityStepper
						value={item.quantity}
						onChange={onQuantityChange}
						min={1}
						max={99}
						size="sm"
					/>
				</Box>
			</Box>

			{/* Price and remove - right aligned */}
			<Flex
				flexDirection="column"
				align="end"
				justify="space-between"
				alignSelf="stretch"
			>
				<IconButton
					variant="ghost"
					size="xs"
					onClick={onRemove}
					color="fg.muted"
					m="-1"
					p="1"
					_hover={{ color: "fg" }}
					aria-label={t("cart.removeItem", { name: item.name })}
				>
					<LuX />
				</IconButton>
				<ShopPrice cents={item.totalPrice} fontWeight="medium" />
			</Flex>
		</HStack>
	);
}
