import { cn } from "@menuvo/ui/lib/utils";

interface CategoryNavProps {
	categories: {
		id: string;
		name: string;
	}[];
	activeCategoryId: string | null;
	onCategoryClick: (categoryId: string) => void;
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
			className="z-40 border-border border-b bg-background"
			aria-label="Menu categories"
		>
			{/* Category tabs */}
			<div className="scrollbar-hide flex gap-1.5 overflow-x-auto scroll-smooth px-4 py-2">
				{categories.map((category) => {
					const isActive = activeCategoryId === category.id;

					return (
						<button
							key={category.id}
							type="button"
							onClick={() => onCategoryClick(category.id)}
							className={cn(
								"relative whitespace-nowrap rounded-lg px-3 py-1.5 font-medium text-sm transition-all duration-200",
								"focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								isActive
									? "bg-primary text-primary-foreground shadow-sm"
									: "text-muted-foreground hover:bg-muted hover:text-foreground",
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
