import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
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
	const { t } = useTranslation("discovery");
	const cityOptions = ["all", ...cities];

	return (
		<div className="space-y-4">
			{/* Search input - elevated, prominent */}
			<div className="relative">
				<Search className="pointer-events-none absolute start-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/60" />
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder={t("search.placeholder")}
					className={cn(
						"h-14 w-full rounded-2xl",
						"bg-card ps-14 pe-12",
						"text-foreground text-base",
						"placeholder:text-muted-foreground/50",
						"shadow-lg shadow-foreground/[0.03]",
						"ring-1 ring-border/50",
						"transition-all duration-300",
						"hover:shadow-xl hover:shadow-foreground/[0.05] hover:ring-border/70",
						"focus:outline-none focus:ring-2 focus:ring-primary/40 focus:shadow-xl focus:shadow-primary/10",
					)}
				/>
				{searchQuery && (
					<button
						type="button"
						onClick={() => onSearchChange("")}
						className="absolute end-4 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						aria-label={t("search.clearSearch")}
					>
						<X className="size-4" />
					</button>
				)}
			</div>

			{/* City filter pills - centered, refined */}
			<div className="scrollbar-hide flex justify-center gap-2 overflow-x-auto pb-1">
				{cityOptions.map((city) => {
					const isSelected = city === selectedCity;
					const label = city === "all" ? t("search.allCities") : city;

					return (
						<button
							key={city}
							type="button"
							onClick={() => onCityChange(city)}
							className={cn(
								"flex-shrink-0 whitespace-nowrap rounded-full px-5 py-2",
								"text-sm font-medium transition-all duration-200",
								isSelected
									? "bg-foreground text-background shadow-md"
									: "bg-card/80 text-muted-foreground ring-1 ring-border/50 hover:bg-card hover:ring-border hover:text-foreground",
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
