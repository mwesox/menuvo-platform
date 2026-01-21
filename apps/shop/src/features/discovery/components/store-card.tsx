import {
	Box,
	Center,
	Circle,
	Flex,
	HStack,
	Image,
	Text,
} from "@chakra-ui/react";
import { Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { LuMapPin } from "react-icons/lu";
import {
	focusRingProps,
	ShopHeading,
	ShopMutedText,
} from "../../shared/components/ui";

interface StoreCardProps {
	store: {
		id: string;
		name: string;
		slug: string;
		street: string | null;
		city: string | null;
		logoUrl?: string | null;
		isOpen?: boolean;
	};
	style?: CSSProperties;
}

export function StoreCard({ store, style }: StoreCardProps) {
	const { t } = useTranslation("discovery");
	const addressParts = [store.street, store.city].filter(Boolean);
	const formattedAddress = addressParts.join(", ");

	return (
		<Link
			to="/$slug"
			params={{ slug: store.slug }}
			style={{ textDecoration: "none", ...style }}
		>
			<Box
				display="block"
				overflow="hidden"
				rounded="xl"
				bg="bg.panel"
				borderWidth="1px"
				borderColor="border.muted"
				transition="all 0.3s ease-out"
				_hover={{
					shadow: "lg",
					borderColor: "border",
					transform: "translateY(-2px)",
				}}
				animation="card-enter 0.3s ease-out backwards"
				css={{
					"@keyframes card-enter": {
						from: {
							opacity: 0,
							transform: "translateY(8px)",
						},
						to: {
							opacity: 1,
							transform: "translateY(0)",
						},
					},
				}}
				{...focusRingProps}
			>
				{/* Image container - cinematic 16:10 aspect ratio */}
				<Box
					position="relative"
					aspectRatio="16 / 10"
					overflow="hidden"
					bg="bg.muted"
				>
					{store.logoUrl ? (
						<Image
							src={store.logoUrl}
							alt={store.name}
							w="full"
							h="full"
							objectFit="cover"
							transition="transform 0.5s ease-out"
							css={{
								".group:hover &, a:hover &": {
									transform: "scale(1.03)",
								},
							}}
						/>
					) : (
						/* Placeholder for missing images */
						<Center h="full" w="full" bg="bg.muted">
							<Text
								fontSize="4xl"
								fontWeight="semibold"
								color="fg.muted"
								opacity={0.2}
							>
								{store.name.charAt(0)}
							</Text>
						</Center>
					)}

					{/* Status badge - positioned on image (only show if isOpen is defined) */}
					{store.isOpen !== undefined && (
						<Box position="absolute" bottom="3" left="3">
							<HStack
								gap="1.5"
								rounded="lg"
								px="2.5"
								py="1"
								fontSize="xs"
								fontWeight="medium"
								css={{ backdropFilter: "blur(12px)" }}
								bg={store.isOpen ? "green.500/90" : "blackAlpha.600"}
								color="white"
							>
								<Circle
									size="1.5"
									bg={store.isOpen ? "white" : "whiteAlpha.600"}
									css={
										store.isOpen
											? { animation: "pulse 2s infinite" }
											: undefined
									}
								/>
								<Text color={store.isOpen ? "white" : "whiteAlpha.900"}>
									{store.isOpen
										? t("storeCard.openNow")
										: t("storeCard.closed")}
								</Text>
							</HStack>
						</Box>
					)}
				</Box>

				{/* Content - more breathing room */}
				<Box p={{ base: "4", sm: "5" }}>
					<ShopHeading as="h3" size="lg" fontSize={{ base: "lg", sm: "xl" }}>
						{store.name}
					</ShopHeading>

					{formattedAddress && (
						<Flex
							mt="1.5"
							align="center"
							gap="1.5"
							fontSize="sm"
							color="fg.muted"
						>
							<Box as={LuMapPin} boxSize="3.5" flexShrink={0} opacity={0.6} />
							<ShopMutedText truncate>{formattedAddress}</ShopMutedText>
						</Flex>
					)}
				</Box>
			</Box>
		</Link>
	);
}
