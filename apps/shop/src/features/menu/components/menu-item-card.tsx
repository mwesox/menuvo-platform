import { cn } from "@menuvo/ui/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, UtensilsCrossed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTRPC } from "../../../lib/trpc";
import { focusRing, ShopPrice } from "../../shared/components/ui";
import { menuQueryDefaults, resolveMenuLanguageCode } from "../queries";
import type { MenuItemLight } from "../types";

interface MenuItemCardProps {
	item: MenuItemLight;
	onSelect: (item: MenuItemLight) => void;
}

export function MenuItemCard({ item, onSelect }: MenuItemCardProps) {
	const { t, i18n } = useTranslation(["shop", "menu"]);
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const languageCode = resolveMenuLanguageCode(
		i18n.resolvedLanguage ?? i18n.language,
	);

	const handleCardClick = () => {
		onSelect(item);
	};

	// Prefetch item options on hover for items that have options
	const handlePointerEnter = () => {
		if (item.hasOptionGroups) {
			queryClient.prefetchQuery({
				...trpc.menu.shop.getItemDetails.queryOptions({
					itemId: item.id,
					languageCode,
				}),
				staleTime: menuQueryDefaults.staleTimeMs,
			});
		}
	};

	return (
		<button
			type="button"
			onClick={handleCardClick}
			onPointerEnter={handlePointerEnter}
			className={cn(
				"group @container flex w-full @xs:gap-4 gap-3 rounded-xl bg-card @xs:p-4 p-3 text-start",
				"border border-border shadow-sm",
				"transition-all duration-200 ease-out",
				"hover:-translate-y-0.5 hover:shadow-md",
				focusRing,
			)}
		>
			{/* Image - 4:3 ratio for better food photography, responsive via container queries */}
			<div className="relative @md:h-24 @xs:h-[5.25rem] h-[4.5rem] @md:w-32 @xs:w-28 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
				{item.imageUrl ? (
					<img
						src={item.imageUrl}
						alt={item.name}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<div className="absolute inset-0 flex items-center justify-center">
						<UtensilsCrossed className="size-7 text-muted-foreground/20" />
					</div>
				)}
			</div>

			{/* Content - clear hierarchy */}
			<div className="flex min-w-0 flex-1 flex-col">
				{/* Row 1: Name (MOST PROMINENT - larger and bolder) */}
				<h3 className="font-semibold @md:text-xl text-foreground text-lg leading-snug">
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
						{item.allergens.map((allergen: string) => (
							<span
								key={allergen}
								className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs"
							>
								{String(t(`menu:allergens.${allergen}`, allergen))}
							</span>
						))}
					</div>
				)}

				{/* Spacer */}
				<div className="flex-1" />

				{/* Row 4: Price + Action */}
				<div className="mt-3 flex items-center justify-between">
					<ShopPrice cents={item.price} size="lg" className="text-foreground" />

					<span
						aria-hidden="true"
						className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all duration-150 group-hover:scale-105 group-active:scale-95"
					>
						<Plus className="size-5" strokeWidth={2.5} />
					</span>
				</div>
			</div>
		</button>
	);
}
