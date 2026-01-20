/**
 * AI Recommendations Section
 *
 * Displays AI-powered product suggestions at checkout.
 * Gracefully handles loading, errors, and empty states.
 * Shows dynamic, AI-generated section titles based on cart contents.
 */

import { Skeleton } from "@menuvo/ui";
import { useQuery } from "@tanstack/react-query";
import { Plus, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTRPC } from "../../../lib/trpc";
import type { CartItem } from "../../cart/stores/cart-store";
import {
	ShopButton,
	ShopCard,
	ShopHeading,
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
		<ShopCard padding="md" className="space-y-4">
			<div className="flex items-center gap-2">
				<Sparkles className="size-5 text-primary" />
				<ShopHeading as="h2" size="md">
					{sectionTitle}
				</ShopHeading>
			</div>

			<div className="space-y-3">
				{recommendationsData.suggestions.map((item) => (
					<div
						key={item.itemId}
						className="flex items-center gap-3 rounded-lg border border-border p-3"
					>
						{/* Item Image */}
						<ShopImage
							src={item.imageUrl}
							alt={item.name}
							className="size-16 shrink-0"
							aspectRatio="square"
						/>

						{/* Item Info */}
						<div className="min-w-0 flex-1">
							<p className="truncate font-medium text-sm">{item.name}</p>
							<ShopMutedText className="text-xs">{item.reason}</ShopMutedText>
							<ShopPrice cents={item.price} size="sm" className="mt-1" />
						</div>

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
							<Plus className="size-4" />
						</ShopButton>
					</div>
				))}
			</div>
		</ShopCard>
	);
}

function RecommendationsSkeleton() {
	return (
		<ShopCard padding="md" className="space-y-4">
			<div className="flex items-center gap-2">
				<Skeleton className="size-5" />
				<Skeleton className="h-5 w-40" />
			</div>

			<div className="space-y-3">
				{[1, 2].map((i) => (
					<div
						key={i}
						className="flex items-center gap-3 rounded-lg border border-border p-3"
					>
						<Skeleton className="size-16 shrink-0 rounded-lg" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-3 w-24" />
							<Skeleton className="h-4 w-16" />
						</div>
						<Skeleton className="size-8 rounded-lg" />
					</div>
				))}
			</div>
		</ShopCard>
	);
}
