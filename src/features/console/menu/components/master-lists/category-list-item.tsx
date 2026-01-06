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
				"flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors",
				"hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				isSelected && "bg-accent",
			)}
		>
			<div
				className={cn(
					"flex size-8 flex-shrink-0 items-center justify-center rounded-md",
					isSelected ? "bg-primary text-primary-foreground" : "bg-muted",
				)}
			>
				<Layers className="size-4" />
			</div>

			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							"truncate font-medium",
							!category.isActive && "text-muted-foreground",
						)}
					>
						{displayName}
					</span>
					{!category.isActive && (
						<EyeOff className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
					)}
				</div>
				<div className="text-muted-foreground text-xs">
					{itemCount} {itemCount === 1 ? t("labels.item") : t("labels.items")}
					{availableCount < itemCount && (
						<span className="ms-1">
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
