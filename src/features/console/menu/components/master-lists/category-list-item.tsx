import { EyeOff, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
	SelectableItem,
	SelectableItemActions,
	SelectableItemContent,
	SelectableItemDescription,
	SelectableItemMedia,
	SelectableItemTitle,
} from "@/components/ui/selectable-item";
import type { Category, Item } from "@/db/schema";
import { useEntityDisplayName } from "@/features/console/menu/hooks";
import { cn } from "@/lib/utils";

type CategoryWithItems = Category & { items: Item[] };

interface CategoryListItemProps {
	category: CategoryWithItems;
	isSelected: boolean;
	onSelect: (id: string) => void;
}

export function CategoryListItem({
	category,
	isSelected,
	onSelect,
}: CategoryListItemProps) {
	const { t } = useTranslation("common");
	const { t: tMenu } = useTranslation("menu");
	const displayName = useEntityDisplayName(category.translations);
	const itemCount = category.items.length;
	const availableCount = category.items.filter((i) => i.isAvailable).length;

	return (
		<SelectableItem variant={isSelected ? "selected" : "default"} asChild>
			<button type="button" onClick={() => onSelect(category.id)}>
				<SelectableItemMedia variant="icon">
					<Layers className="size-4" />
				</SelectableItemMedia>

				<SelectableItemContent>
					<div className="flex items-center gap-2">
						<SelectableItemTitle
							className={cn(!category.isActive && "text-muted-foreground")}
						>
							{displayName}
						</SelectableItemTitle>
						{!category.isActive && (
							<EyeOff className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
						)}
					</div>
					<SelectableItemDescription>
						{itemCount} {itemCount === 1 ? t("labels.item") : t("labels.items")}
						{availableCount < itemCount && (
							<span className="ms-1">
								({availableCount} {tMenu("labels.available")})
							</span>
						)}
					</SelectableItemDescription>
				</SelectableItemContent>

				<SelectableItemActions>
					<Badge variant="secondary" className="tabular-nums">
						{itemCount}
					</Badge>
				</SelectableItemActions>
			</button>
		</SelectableItem>
	);
}
