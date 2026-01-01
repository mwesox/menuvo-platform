import { ShopPillButton } from "./ui";

interface CategoryNavProps {
	categories: {
		id: number;
		name: string;
	}[];
	activeCategoryId: number | null;
	onCategoryClick: (categoryId: number) => void;
}

export function CategoryNav({
	categories,
	activeCategoryId,
	onCategoryClick,
}: CategoryNavProps) {
	if (categories.length === 0) {
		return null;
	}

	return (
		<nav
			className="sticky top-14 z-40 bg-background border-b border-border/50"
			aria-label="Menu categories"
		>
			<div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 py-2 scroll-smooth snap-x snap-mandatory">
				{categories.map((category) => {
					const isActive = activeCategoryId === category.id;

					return (
						<ShopPillButton
							key={category.id}
							onClick={() => onCategoryClick(category.id)}
							active={isActive}
							className="snap-start"
							aria-current={isActive ? "true" : undefined}
						>
							{category.name}
						</ShopPillButton>
					);
				})}
			</div>
		</nav>
	);
}
