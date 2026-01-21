import { Box, SimpleGrid } from "@chakra-ui/react";
import { ShopHeading, ShopMutedText } from "../../shared/components/ui";
import type { MenuCategory } from "../types";
import { MenuItemCard } from "./menu-item-card";

type CategoryItem = MenuCategory["items"][number];

interface CategorySectionProps {
	category: MenuCategory;
	onItemSelect: (item: CategoryItem) => void;
	refSetter: (el: HTMLDivElement | null) => void;
}

/**
 * Renders a single category section with its name, description, and items.
 * Uses a responsive grid: 1 column on mobile, 2 columns on tablet+.
 */
export function CategorySection({
	category,
	onItemSelect,
	refSetter,
}: CategorySectionProps) {
	return (
		<Box as="section" ref={refSetter} data-category-id={category.id} mb="10">
			{/* Category header */}
			<ShopHeading as="h2" size="xl" mb="4">
				{category.name}
			</ShopHeading>

			{/* Category description */}
			{category.description && (
				<ShopMutedText mb="4" maxW="lg" textStyle="sm">
					{category.description}
				</ShopMutedText>
			)}

			{/*
			Items grid - professional responsive approach:
			- Uses SimpleGrid for consistent column tracks
			- Responsive columns: 1 on mobile, 2 on sm, 3 on xl
			- Consistent visual rhythm regardless of item count
		*/}
			<SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} gap="4">
				{category.items.map((item: CategoryItem) => (
					<MenuItemCard
						key={item.id}
						item={item}
						onSelect={() => onItemSelect(item)}
					/>
				))}
			</SimpleGrid>
		</Box>
	);
}
