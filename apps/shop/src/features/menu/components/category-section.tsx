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

			{/* Items grid - auto-fit columns based on available space (min 280px per card, max 3 columns) */}
			<div className="grid max-w-5xl grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
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
