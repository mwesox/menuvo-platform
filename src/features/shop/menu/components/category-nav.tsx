import { cn } from "@/lib/utils";

interface CategoryNavProps {
	categories: {
		id: number;
		name: string;
		itemCount?: number;
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
			className="sticky top-14 z-40 bg-background border-b border-border"
			aria-label="Menu categories"
		>
			{/* Scroll container with fade edges */}
			<div className="relative">
				{/* Left fade indicator */}
				<div className="absolute start-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />

				{/* Category tabs */}
				<div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 scroll-smooth">
					{categories.map((category) => {
						const isActive = activeCategoryId === category.id;

						return (
							<button
								key={category.id}
								type="button"
								onClick={() => onCategoryClick(category.id)}
								className={cn(
									"relative px-4 py-2 text-sm font-medium whitespace-nowrap rounded-full transition-all duration-200",
									"focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
									isActive
										? "bg-primary text-primary-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground hover:bg-muted",
								)}
								aria-current={isActive ? "true" : undefined}
							>
								{category.name}
								{/* Item count badge */}
								{category.itemCount !== undefined && category.itemCount > 0 && (
									<span
										className={cn(
											"ms-1.5 text-xs tabular-nums",
											isActive
												? "text-primary-foreground/70"
												: "text-muted-foreground/60",
										)}
									>
										({category.itemCount})
									</span>
								)}
							</button>
						);
					})}
				</div>

				{/* Right fade indicator */}
				<div className="absolute end-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
			</div>
		</nav>
	);
}
