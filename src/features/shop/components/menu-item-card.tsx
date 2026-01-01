import { Plus } from "lucide-react";
import { formatPrice } from "../utils";

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
	const handleCardClick = () => {
		onSelect(item);
	};

	return (
		<button
			type="button"
			onClick={handleCardClick}
			className="flex gap-3 p-3 bg-shop-card rounded-xl cursor-pointer transition-colors hover:bg-shop-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-shop-accent text-left w-full animate-in fade-in duration-300"
		>
			{/* Image */}
			<div className="w-20 h-20 rounded-lg flex-shrink-0 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
				{item.imageUrl && (
					<img
						src={item.imageUrl}
						alt={item.name}
						className="w-full h-full object-cover"
					/>
				)}
			</div>

			{/* Content */}
			<div className="flex-1 min-w-0 flex flex-col justify-between">
				<div>
					<h3
						style={{ fontFamily: "var(--font-heading)" }}
						className="text-shop-foreground font-normal"
					>
						{item.name}
					</h3>
					{item.description && (
						<p className="text-sm text-shop-foreground-muted line-clamp-2 mt-0.5">
							{item.description}
						</p>
					)}
					{item.allergens && item.allergens.length > 0 && (
						<div className="flex flex-wrap gap-1 mt-1">
							{item.allergens.map((allergen) => (
								<span
									key={allergen}
									className="text-xs px-1.5 py-0.5 bg-shop-background-subtle rounded text-shop-foreground-muted"
								>
									{allergen}
								</span>
							))}
						</div>
					)}
				</div>

				{/* Bottom row - price and button */}
				<div className="flex items-center justify-between mt-2">
					<span className="text-shop-foreground font-medium">
						{formatPrice(item.price)}
					</span>
					<span
						aria-hidden="true"
						className="px-3 py-1.5 bg-shop-accent text-shop-accent-foreground rounded-lg text-sm font-medium transition-colors hover:bg-shop-accent-hover"
					>
						{item.hasOptions ? (
							"Customize"
						) : (
							<span className="flex items-center gap-1">
								<Plus className="w-4 h-4" />
								Add
							</span>
						)}
					</span>
				</div>
			</div>
		</button>
	);
}
