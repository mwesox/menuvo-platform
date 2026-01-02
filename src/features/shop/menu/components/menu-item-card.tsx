import { Plus, UtensilsCrossed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { focusRing, ShopPrice } from "../../shared/components/ui";

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
	const { t } = useTranslation("shop");

	const handleCardClick = () => {
		onSelect(item);
	};

	return (
		<button
			type="button"
			onClick={handleCardClick}
			className={cn(
				"group flex gap-4 p-4 bg-card rounded-2xl text-left w-full",
				"border border-transparent transition-all duration-200",
				"hover:border-border hover:shadow-md",
				focusRing,
			)}
		>
			{/* Image - neutral placeholder */}
			<div className="relative w-24 h-24 rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
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
					className="text-xl font-medium text-foreground leading-snug"
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
								{allergen}
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
							"px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
							item.hasOptions
								? "bg-muted text-foreground border border-border hover:bg-muted/80"
								: "bg-foreground text-background hover:bg-foreground/90",
						)}
					>
						{item.hasOptions ? (
							t("menu.customize")
						) : (
							<span className="flex items-center gap-1">
								<Plus className="w-4 h-4" />
								{t("menu.add")}
							</span>
						)}
					</span>
				</div>
			</div>
		</button>
	);
}
