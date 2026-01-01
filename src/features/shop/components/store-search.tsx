import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StoreSearchProps {
	cities: string[];
	selectedCity: string;
	searchQuery: string;
	onCityChange: (city: string) => void;
	onSearchChange: (query: string) => void;
}

export function StoreSearch({
	cities,
	selectedCity,
	searchQuery,
	onCityChange,
	onSearchChange,
}: StoreSearchProps) {
	const cityOptions = ["all", ...cities];

	return (
		<div className="space-y-4">
			{/* Search input */}
			<div className="relative">
				<Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-shop-foreground-muted" />
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder="Search restaurants..."
					className="h-12 w-full rounded-xl border border-shop-border bg-shop-card pl-12 pr-10 text-shop-foreground transition-colors placeholder:text-shop-foreground-muted/60 focus:border-shop-accent focus:outline-none focus:ring-2 focus:ring-shop-accent/20"
				/>
				{searchQuery && (
					<button
						type="button"
						onClick={() => onSearchChange("")}
						className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-shop-foreground-muted transition-colors hover:text-shop-foreground"
						aria-label="Clear search"
					>
						<X className="h-4 w-4" />
					</button>
				)}
			</div>

			{/* City filter pills */}
			<div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
				{cityOptions.map((city) => {
					const isSelected = city === selectedCity;
					const label = city === "all" ? "All" : city;

					return (
						<button
							key={city}
							type="button"
							onClick={() => onCityChange(city)}
							className={cn(
								"flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
								isSelected
									? "bg-shop-accent text-shop-accent-foreground"
									: "border border-shop-border bg-shop-card text-shop-foreground-muted hover:border-shop-border hover:text-shop-foreground",
							)}
						>
							{label}
						</button>
					);
				})}
			</div>
		</div>
	);
}
