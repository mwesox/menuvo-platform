import { cn } from "@/lib/utils";

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
			className="sticky top-14 z-40 bg-shop-background border-b border-shop-border-subtle"
			aria-label="Menu categories"
		>
			<div className="flex gap-1 overflow-x-auto scrollbar-hide px-4 py-2 scroll-smooth snap-x snap-mandatory">
				{categories.map((category) => {
					const isActive = activeCategoryId === category.id;

					return (
						<button
							key={category.id}
							type="button"
							onClick={() => onCategoryClick(category.id)}
							className={cn(
								"px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200 snap-start",
								isActive
									? "bg-shop-accent text-shop-accent-foreground"
									: "text-shop-foreground-muted hover:text-shop-foreground hover:bg-shop-background-subtle",
							)}
							aria-current={isActive ? "true" : undefined}
						>
							{category.name}
						</button>
					);
				})}
			</div>
		</nav>
	);
}
