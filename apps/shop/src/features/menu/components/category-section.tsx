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
			<h2
				className="mb-4 text-2xl text-foreground"
				style={{ fontFamily: "var(--font-heading)" }}
			>
				{category.name}
			</h2>

			{/* Category description */}
			{category.description && (
				<p className="mb-4 max-w-lg text-muted-foreground text-sm">
					{category.description}
				</p>
			)}

			{/* Items grid - responsive 1-2-3 columns with container queries */}
			<div className="@container grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
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
