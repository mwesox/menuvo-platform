/**
 * AI Recommendations Section
 *
 * Displays AI-powered product suggestions at checkout.
 * Gracefully handles loading, errors, and empty states.
 * Shows dynamic, AI-generated section titles based on cart contents.
 */

import { Box, Flex, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LuPlus, LuSparkles } from "react-icons/lu";
import { useTRPC } from "../../../lib/trpc";
import type { CartItem } from "../../cart/stores/cart-store";
import {
	SectionHeader,
	ShopButton,
	ShopCard,
	ShopImage,
	ShopMutedText,
	ShopPrice,
} from "../../shared/components/ui";

interface RecommendationsSectionProps {
	storeSlug: string;
	cartItems: CartItem[];
	languageCode: string;
	onAddItem: (item: {
		itemId: string;
		name: string;
		price: number;
		imageUrl: string | null;
	}) => void;
}

export function RecommendationsSection({
	storeSlug,
	cartItems,
	languageCode,
	onAddItem,
}: RecommendationsSectionProps) {
	const { t } = useTranslation("shop");
	const trpc = useTRPC();

	// Only fetch if we have cart items
	const cartItemIds = cartItems.map((item) => item.itemId);

	const { data: recommendationsData, isLoading } = useQuery({
		...trpc.store.recommendations.getRecommendations.queryOptions({
			storeSlug,
			cartItemIds,
			languageCode,
		}),
		enabled: cartItemIds.length > 0,
		staleTime: 30_000, // 30 seconds
		retry: false, // Don't retry on failure - graceful degradation
	});

	// Don't render section if loading, no recommendations, or empty cart
	if (isLoading) {
		return <RecommendationsSkeleton />;
	}

	if (
		!recommendationsData ||
		!recommendationsData.suggestions ||
		recommendationsData.suggestions.length === 0
	) {
		return null;
	}

	// Use dynamic title from AI, fallback to i18n title for backwards compatibility
	const sectionTitle =
		recommendationsData.sectionTitle || t("ordering.recommendations.title");

	return (
		<ShopCard padding="md">
			<Stack gap="4">
				<SectionHeader title={sectionTitle} icon={LuSparkles} />

				<Stack gap="3">
					{recommendationsData.suggestions.map((item) => (
						<Flex
							key={item.itemId}
							align="center"
							gap="3"
							rounded="lg"
							borderWidth="1px"
							borderColor="border"
							p="3"
						>
							{/* Item Image */}
							<ShopImage
								src={item.imageUrl}
								alt={item.name}
								boxSize="16"
								flexShrink={0}
								aspectRatio="square"
							/>

							{/* Item Info */}
							<Box minW="0" flex="1">
								<Text truncate fontWeight="medium" textStyle="sm">
									{item.name}
								</Text>
								<ShopMutedText textStyle="xs">{item.reason}</ShopMutedText>
								<ShopPrice cents={item.price} size="sm" mt="1" />
							</Box>

							{/* Add Button */}
							<ShopButton
								variant="secondary"
								size="icon-sm"
								onClick={() =>
									onAddItem({
										itemId: item.itemId,
										name: item.name,
										price: item.price,
										imageUrl: item.imageUrl,
									})
								}
								aria-label={t("ordering.recommendations.addToCart", {
									name: item.name,
								})}
							>
								<LuPlus />
							</ShopButton>
						</Flex>
					))}
				</Stack>
			</Stack>
		</ShopCard>
	);
}

function RecommendationsSkeleton() {
	return (
		<ShopCard padding="md">
			<Stack gap="4">
				<HStack gap="2">
					<Skeleton boxSize="5" />
					<Skeleton h="5" w="40" />
				</HStack>

				<Stack gap="3">
					{[1, 2].map((i) => (
						<Flex
							key={i}
							align="center"
							gap="3"
							rounded="lg"
							borderWidth="1px"
							borderColor="border"
							p="3"
						>
							<Skeleton boxSize="16" flexShrink={0} rounded="lg" />
							<Stack flex="1" gap="2">
								<Skeleton h="4" w="32" />
								<Skeleton h="3" w="24" />
								<Skeleton h="4" w="16" />
							</Stack>
							<Skeleton boxSize="8" rounded="lg" />
						</Flex>
					))}
				</Stack>
			</Stack>
		</ShopCard>
	);
}
