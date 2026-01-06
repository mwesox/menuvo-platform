import { ImageOff } from "lucide-react";
import type { Item } from "@/db/schema";
import { useEntityDisplayName } from "@/features/console/menu/hooks";
import { cn } from "@/lib/utils";

interface ItemListItemProps {
	item: Item;
	isSelected: boolean;
	onSelect: (id: number) => void;
}

function formatPrice(cents: number, currency = "EUR"): string {
	return new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency,
	}).format(cents / 100);
}

export function ItemListItem({
	item,
	isSelected,
	onSelect,
}: ItemListItemProps) {
	const displayName = useEntityDisplayName(item.translations);

	return (
		<button
			type="button"
			onClick={() => onSelect(item.id)}
			className={cn(
				"w-full text-start px-3 py-2.5 rounded-lg transition-colors",
				"hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				isSelected && "bg-accent",
			)}
		>
			<div className="flex items-center gap-3">
				{/* Thumbnail */}
				<div className="flex-shrink-0">
					{item.imageUrl ? (
						<img
							src={item.imageUrl}
							alt={displayName}
							className="size-10 rounded-md object-cover"
						/>
					) : (
						<div className="size-10 rounded-md bg-muted flex items-center justify-center">
							<ImageOff className="size-4 text-muted-foreground" />
						</div>
					)}
				</div>

				{/* Content */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span
							className={cn(
								"font-medium truncate",
								!item.isAvailable && "text-muted-foreground line-through",
							)}
						>
							{displayName}
						</span>
					</div>
					<div className="text-xs text-muted-foreground">
						{formatPrice(item.price)}
						{!item.isAvailable && (
							<span className="ms-2 text-amber-600">Nicht verfügbar</span>
						)}
					</div>
				</div>

				{/* Availability indicator */}
				<div
					className={cn(
						"flex-shrink-0 size-2 rounded-full",
						item.isAvailable ? "bg-green-500" : "bg-amber-500",
					)}
				/>
			</div>
		</button>
	);
}
