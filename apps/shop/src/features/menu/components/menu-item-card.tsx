import {
	Box,
	type BoxProps,
	Center,
	chakra,
	Flex,
	HStack,
	Image,
	Wrap,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LuPlus, LuUtensilsCrossed } from "react-icons/lu";
import { useTRPC } from "../../../lib/trpc";
import {
	focusRingProps,
	ShopBadge,
	ShopHeading,
	ShopMutedText,
	ShopPrice,
} from "../../shared/components/ui";
import { menuQueryDefaults, resolveMenuLanguageCode } from "../queries";
import type { MenuItemLight } from "../types";

interface MenuItemCardProps {
	item: MenuItemLight;
	onSelect: (item: MenuItemLight) => void;
}

// Chakra-styled button element for proper type inference
const CardButton = chakra("button");

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
	const { t, i18n } = useTranslation(["shop", "menu"]);
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const languageCode = resolveMenuLanguageCode(
		i18n.resolvedLanguage ?? i18n.language,
	);

	const handleCardClick = () => {
		onSelect(item);
	};

	// Prefetch item options on hover for items that have options
	const handlePointerEnter = () => {
		if (item.hasOptionGroups) {
			queryClient.prefetchQuery({
				...trpc.menu.shop.getItemDetails.queryOptions({
					itemId: item.id,
					languageCode,
				}),
				staleTime: menuQueryDefaults.staleTimeMs,
			});
		}
	};

	// Responsive image sizes using CSS container queries via style prop
	const imageStyles: BoxProps = {
		position: "relative",
		flexShrink: 0,
		overflow: "hidden",
		rounded: "lg",
		bg: "bg.muted",
		// Base size (mobile)
		h: "72px",
		w: "96px",
		// CSS container query styles applied via css prop
		css: {
			"@container (min-width: 320px)": {
				height: "84px",
				width: "112px",
			},
			"@container (min-width: 448px)": {
				height: "96px",
				width: "128px",
			},
		},
	};

	return (
		<CardButton
			type="button"
			onClick={handleCardClick}
			onPointerEnter={handlePointerEnter}
			display="flex"
			w="full"
			gap={{ base: "3", sm: "4" }}
			rounded="xl"
			bg="bg.panel"
			p={{ base: "3", sm: "4" }}
			textAlign="start"
			borderWidth="1px"
			borderColor="border"
			shadow="sm"
			transition="all"
			transitionDuration="200ms"
			transitionTimingFunction="ease-out"
			cursor="pointer"
			containerType="inline-size"
			_hover={{
				transform: "translateY(-2px)",
				shadow: "md",
			}}
			{...focusRingProps}
		>
			{/* Image - 4:3 ratio for better food photography */}
			<Box {...imageStyles}>
				{item.imageUrl ? (
					<Image
						src={item.imageUrl}
						alt={item.name}
						h="full"
						w="full"
						objectFit="cover"
						transition="transform"
						transitionDuration="300ms"
						css={{
							"button:hover &": {
								transform: "scale(1.05)",
							},
						}}
					/>
				) : (
					<Center position="absolute" inset="0">
						<Box as={LuUtensilsCrossed} boxSize="7" color="fg.subtle" />
					</Center>
				)}
			</Box>

			{/* Content - clear hierarchy */}
			<Flex minW="0" flex="1" direction="column">
				{/* Row 1: Name (MOST PROMINENT - larger and bolder) */}
				<ShopHeading
					as="h3"
					size="md"
					lineHeight="snug"
					css={{
						"@container (min-width: 448px)": {
							fontSize: "var(--font-sizes-xl)",
						},
					}}
				>
					{item.name}
				</ShopHeading>

				{/* Row 2: Description (if exists) */}
				{item.description && (
					<ShopMutedText mt="1" lineClamp={2} textStyle="sm">
						{item.description}
					</ShopMutedText>
				)}

				{/* Row 3: Allergens (subtle badges) */}
				{item.allergens && item.allergens.length > 0 && (
					<Wrap mt="2" gap="1">
						{item.allergens.map((allergen: string) => (
							<ShopBadge key={allergen} variant="allergen" size="sm">
								{String(t(`menu:allergens.${allergen}`, allergen))}
							</ShopBadge>
						))}
					</Wrap>
				)}

				{/* Spacer */}
				<Box flex="1" />

				{/* Row 4: Price + Action */}
				<HStack mt="3" justify="space-between">
					<ShopPrice cents={item.price} size="lg" />

					<Center
						aria-hidden="true"
						boxSize="10"
						rounded="full"
						bg="teal.solid"
						color="teal.contrast"
						transition="transform"
						transitionDuration="150ms"
						css={{
							"button:hover &": {
								transform: "scale(1.05)",
							},
							"button:active &": {
								transform: "scale(0.95)",
							},
						}}
					>
						<Box as={LuPlus} boxSize="5" strokeWidth={2.5} />
					</Center>
				</HStack>
			</Flex>
		</CardButton>
	);
}
