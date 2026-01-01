import type { MenuItem } from "../../validation";
import { MenuItemCard } from "./menu-item-card";

interface CategorySectionProps {
	category: {
		id: number;
		name: string;
		description: string | null;
		items: MenuItem[];
	};
	onItemSelect: (item: MenuItem) => void;
	refSetter: (el: HTMLDivElement | null) => void;
}

/**
 * Renders a single category section with its name, description, and items.
 * Used in the store menu page to display each category.
 */
export function CategorySection({
	category,
	onItemSelect,
	refSetter,
}: CategorySectionProps) {
	return (
		<section ref={refSetter} data-category-id={category.id} className="mb-8">
			<h2
				className="mb-3 text-xl text-foreground"
				style={{ fontFamily: "var(--font-heading)" }}
			>
				{category.name}
			</h2>
			{category.description && (
				<p className="mb-4 text-sm text-muted-foreground">
					{category.description}
				</p>
			)}

			<div className="space-y-3">
				{category.items.map((item) => (
					<MenuItemCard
						key={item.id}
						item={{
							...item,
							hasOptions: item.optionGroups.length > 0,
						}}
						onSelect={() => onItemSelect(item)}
					/>
				))}
			</div>
		</section>
	);
}
