import { useTranslation } from "react-i18next";
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
 * Uses a responsive grid: 1 column on mobile, 2 columns on tablet+.
 */
export function CategorySection({
	category,
	onItemSelect,
	refSetter,
}: CategorySectionProps) {
	const { t } = useTranslation("shop");
	const itemCount = category.items.length;

	return (
		<section ref={refSetter} data-category-id={category.id} className="mb-10">
			{/* Category header with item count */}
			<div className="flex items-baseline gap-3 mb-4">
				<h2
					className="text-2xl text-foreground"
					style={{ fontFamily: "var(--font-heading)" }}
				>
					{category.name}
				</h2>
				<span className="text-sm text-muted-foreground tabular-nums">
					{t("menu.itemCount", { count: itemCount })}
				</span>
			</div>

			{/* Category description */}
			{category.description && (
				<p className="mb-4 text-sm text-muted-foreground max-w-lg">
					{category.description}
				</p>
			)}

			{/* Items grid - responsive 1-2 columns */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
