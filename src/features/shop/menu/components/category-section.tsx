import { useTranslation } from "react-i18next";
import type { MenuItemLight } from "../../schemas";
import { MenuItemCard } from "./menu-item-card";

interface CategorySectionProps {
	category: {
		id: number;
		name: string;
		description: string | null;
		items: MenuItemLight[];
	};
	onItemSelect: (item: MenuItemLight) => void;
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
			<div className="mb-4 flex items-baseline gap-3">
				<h2
					className="text-2xl text-foreground"
					style={{ fontFamily: "var(--font-heading)" }}
				>
					{category.name}
				</h2>
				<span className="text-muted-foreground text-sm tabular-nums">
					{t("menu.itemCount", { count: itemCount })}
				</span>
			</div>

			{/* Category description */}
			{category.description && (
				<p className="mb-4 max-w-lg text-muted-foreground text-sm">
					{category.description}
				</p>
			)}

			{/* Items grid - responsive 1-2-3 columns with container queries */}
			<div className="@container grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
				{category.items.map((item) => (
					<MenuItemCard
						key={item.id}
						item={{
							...item,
							hasOptions: item.hasOptionGroups,
						}}
						onSelect={() => onItemSelect(item)}
					/>
				))}
			</div>
		</section>
	);
}
