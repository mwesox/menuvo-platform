import { ImageOff } from "lucide-react";
import {
	SelectableItem,
	SelectableItemActions,
	SelectableItemContent,
	SelectableItemDescription,
	SelectableItemMedia,
	SelectableItemTitle,
} from "@/components/ui/selectable-item";
import type { Item } from "@/db/schema";
import { useEntityDisplayName } from "@/features/console/menu/hooks";
import { cn } from "@/lib/utils";

interface ItemListItemProps {
	item: Item;
	isSelected: boolean;
	onSelect: (id: string) => void;
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
		<SelectableItem variant={isSelected ? "selected" : "default"} asChild>
			<button type="button" onClick={() => onSelect(item.id)}>
				<SelectableItemMedia variant="image">
					{item.imageUrl ? (
						<img
							src={item.imageUrl}
							alt={displayName}
							className="size-10 rounded-md object-cover"
						/>
					) : (
						<div className="flex size-10 items-center justify-center rounded-md bg-muted">
							<ImageOff className="size-4 text-muted-foreground" />
						</div>
					)}
				</SelectableItemMedia>

				<SelectableItemContent>
					<div className="flex items-center gap-2">
						<SelectableItemTitle
							className={cn(
								!item.isAvailable && "text-muted-foreground line-through",
							)}
						>
							{displayName}
						</SelectableItemTitle>
					</div>
					<SelectableItemDescription>
						{formatPrice(item.price)}
						{!item.isAvailable && (
							<span className="ms-2 text-warning">Nicht verfügbar</span>
						)}
					</SelectableItemDescription>
				</SelectableItemContent>

				<SelectableItemActions>
					<span
						className={cn(
							"size-2 rounded-full",
							item.isAvailable ? "bg-success" : "bg-warning",
						)}
					/>
				</SelectableItemActions>
			</button>
		</SelectableItem>
	);
}
