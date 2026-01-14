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
		<section ref={refSetter} data-category-id={category.id} className="mb-10">
			{/* Category header */}
			<h2 className="mb-4 font-semibold text-2xl text-foreground">
				{category.name}
			</h2>

			{/* Category description */}
			{category.description && (
				<p className="mb-4 max-w-lg text-muted-foreground text-sm">
					{category.description}
				</p>
			)}

			{/*
			Items grid - professional responsive approach:
			- auto-fill (not auto-fit) keeps consistent column tracks
			- Cards have max-width to prevent over-stretching
			- justify-items-start ensures orphan cards stay left-aligned
			- Consistent visual rhythm regardless of item count
		*/}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{category.items.map((item: CategoryItem) => (
					<MenuItemCard
						key={item.id}
						item={item}
						onSelect={() => onItemSelect(item)}
					/>
				))}
			</div>
		</section>
	);
}
