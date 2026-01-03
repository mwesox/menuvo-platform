import { EyeOff, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { Category, Item } from "@/db/schema";
import { useEntityDisplayName } from "@/features/console/menu/hooks";
import { cn } from "@/lib/utils";

type CategoryWithItems = Category & { items: Item[] };

interface CategoryListItemProps {
	category: CategoryWithItems;
	isSelected: boolean;
	onSelect: (id: number) => void;
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
		<button
			type="button"
			onClick={() => onSelect(category.id)}
			className={cn(
				"flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors",
				"hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				isSelected && "bg-accent",
			)}
		>
			<div
				className={cn(
					"flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
					isSelected ? "bg-primary text-primary-foreground" : "bg-muted",
				)}
			>
				<Layers className="h-4 w-4" />
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"font-medium truncate",
							!category.isActive && "text-muted-foreground",
						)}
					>
						{displayName}
					</span>
					{!category.isActive && (
						<EyeOff className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
					)}
				</div>
				<div className="text-xs text-muted-foreground">
					{itemCount} {itemCount === 1 ? t("labels.item") : t("labels.items")}
					{availableCount < itemCount && (
						<span className="ml-1">
							({availableCount} {tMenu("labels.available")})
						</span>
					)}
				</div>
			</div>

			<Badge variant="secondary" className="flex-shrink-0 tabular-nums">
				{itemCount}
			</Badge>
		</button>
	);
}
