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
		id: string;
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
				"group flex w-full @sm:gap-4 gap-3 rounded-2xl bg-card @sm:p-4 p-3 text-start",
				"border border-border/50 shadow-md shadow-stone-300/50",
				"transition-all duration-300 ease-out",
				"hover:-translate-y-1 hover:border-border/60 hover:shadow-amber-900/10 hover:shadow-lg",
				focusRing,
			)}
		>
			{/* Image - 4:3 ratio for better food photography, responsive via container queries */}
			<div className="relative @md:h-24 @sm:h-[5.25rem] h-[4.5rem] @md:w-32 @sm:w-28 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-stone-100 to-stone-50">
				{item.imageUrl ? (
					<img
						src={item.imageUrl}
						alt={item.name}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<div className="absolute inset-0 flex items-center justify-center">
						<UtensilsCrossed className="size-8 text-slate-300" />
					</div>
				)}
			</div>

			{/* Content - clear hierarchy */}
			<div className="flex min-w-0 flex-1 flex-col">
				{/* Row 1: Name (MOST PROMINENT - larger and bolder) */}
				<h3
					className="font-medium @sm:text-xl text-foreground text-lg leading-snug"
					style={{ fontFamily: "var(--font-heading)" }}
				>
					{item.name}
				</h3>

				{/* Row 2: Description (if exists) */}
				{item.description && (
					<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
						{item.description}
					</p>
				)}

				{/* Row 3: Allergens (subtle badges) */}
				{item.allergens && item.allergens.length > 0 && (
					<div className="mt-2 flex flex-wrap gap-1">
						{item.allergens.map((allergen) => (
							<span
								key={allergen}
								className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs"
							>
								{t(`menu:allergens.${allergen}`, allergen)}
							</span>
						))}
					</div>
				)}

				{/* Spacer */}
				<div className="flex-1" />

				{/* Row 4: Price + Action (bottom, visually separated) */}
				<div className="mt-3 flex items-center justify-between border-border/50 border-t pt-2">
					<ShopPrice cents={item.price} size="lg" className="text-foreground" />

					<span
						aria-hidden="true"
						className={cn(
							"transition-all duration-150",
							item.hasOptions
								? "rounded-lg border border-border/60 bg-muted px-3 py-1.5 font-medium text-foreground text-sm group-hover:bg-muted/80"
								: "flex size-11 items-center justify-center rounded-full bg-foreground text-background group-hover:scale-105 group-active:scale-95",
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
