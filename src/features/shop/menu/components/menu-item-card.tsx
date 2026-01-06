import { useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Plus, UtensilsCrossed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { shopQueries } from "../../queries";
import { focusRing, ShopPrice } from "../../shared/components/ui";

const routeApi = getRouteApi("/$slug/");

interface MenuItemCardProps {
	item: {
		id: number;
		name: string;
		description: string | null;
		price: number;
		imageUrl: string | null;
		allergens: string[] | null;
		hasOptions: boolean;
	};
	onSelect: (item: MenuItemCardProps["item"]) => void;
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
	const { t } = useTranslation(["shop", "menu"]);
	const { slug } = routeApi.useParams();
	const queryClient = useQueryClient();

	const handleCardClick = () => {
		onSelect(item);
	};

	// Prefetch item options on hover for items that have options
	const handlePointerEnter = () => {
		if (item.hasOptions) {
			queryClient.prefetchQuery(shopQueries.itemOptions(item.id, slug));
		}
	};

	return (
		<button
			type="button"
			onClick={handleCardClick}
			onPointerEnter={handlePointerEnter}
			className={cn(
				"group flex gap-3 @sm:gap-4 p-3 @sm:p-4 bg-card rounded-2xl text-left w-full",
				"border border-border/50 shadow-md shadow-stone-300/50",
				"transition-all duration-300 ease-out",
				"hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-900/10 hover:border-border/60",
				focusRing,
			)}
		>
			{/* Image - 4:3 ratio for better food photography, responsive via container queries */}
			<div className="relative w-24 h-[4.5rem] @sm:w-28 @sm:h-[5.25rem] @md:w-32 @md:h-24 rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-stone-100 to-stone-50">
				{item.imageUrl ? (
					<img
						src={item.imageUrl}
						alt={item.name}
						className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<div className="absolute inset-0 flex items-center justify-center">
						<UtensilsCrossed className="w-8 h-8 text-slate-300" />
					</div>
				)}
			</div>

			{/* Content - clear hierarchy */}
			<div className="flex-1 min-w-0 flex flex-col">
				{/* Row 1: Name (MOST PROMINENT - larger and bolder) */}
				<h3
					className="text-lg @sm:text-xl font-medium text-foreground leading-snug"
					style={{ fontFamily: "var(--font-heading)" }}
				>
					{item.name}
				</h3>

				{/* Row 2: Description (if exists) */}
				{item.description && (
					<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
						{item.description}
					</p>
				)}

				{/* Row 3: Allergens (subtle badges) */}
				{item.allergens && item.allergens.length > 0 && (
					<div className="flex flex-wrap gap-1 mt-2">
						{item.allergens.map((allergen) => (
							<span
								key={allergen}
								className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
							>
								{t(`menu:allergens.${allergen}`, allergen)}
							</span>
						))}
					</div>
				)}

				{/* Spacer */}
				<div className="flex-1" />

				{/* Row 4: Price + Action (bottom, visually separated) */}
				<div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
					<ShopPrice cents={item.price} size="lg" className="text-foreground" />

					<span
						aria-hidden="true"
						className={cn(
							"transition-all duration-150",
							item.hasOptions
								? "px-3 py-1.5 rounded-lg text-sm font-medium bg-muted text-foreground border border-border/60 group-hover:bg-muted/80"
								: "flex items-center justify-center size-11 rounded-full bg-foreground text-background group-hover:scale-105 group-active:scale-95",
						)}
					>
						{item.hasOptions ? (
							t("menu.customize")
						) : (
							<Plus className="size-5" strokeWidth={2.5} />
						)}
					</span>
				</div>
			</div>
		</button>
	);
}
