import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	focusRing,
	ShopBadge,
	ShopHeading,
	ShopMutedText,
	ShopPrice,
} from "./ui";

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
			className={cn(
				"flex gap-3 p-3 bg-card rounded-xl cursor-pointer transition-colors hover:bg-card/80 text-left w-full animate-in fade-in duration-300",
				focusRing,
			)}
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
					<ShopHeading as="h3" size="sm" className="font-normal">
						{item.name}
					</ShopHeading>
					{item.description && (
						<ShopMutedText className="text-sm line-clamp-2 mt-0.5">
							{item.description}
						</ShopMutedText>
					)}
					{item.allergens && item.allergens.length > 0 && (
						<div className="flex flex-wrap gap-1 mt-1">
							{item.allergens.map((allergen) => (
								<ShopBadge key={allergen} size="sm" className="rounded">
									{allergen}
								</ShopBadge>
							))}
						</div>
					)}
				</div>

				{/* Bottom row - price and button */}
				<div className="flex items-center justify-between mt-2">
					<ShopPrice cents={item.price} className="font-medium" />
					<span
						aria-hidden="true"
						className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium transition-colors hover:bg-primary/90"
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
