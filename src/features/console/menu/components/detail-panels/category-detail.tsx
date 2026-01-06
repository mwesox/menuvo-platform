import { EyeOff, MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category, Item } from "@/db/schema";
import { useEntityDisplay } from "@/features/console/menu/hooks";

type CategoryWithItems = Category & { items: Item[] };

interface CategoryDetailProps {
	category: CategoryWithItems;
	onEdit: (category: Category) => void;
	onDelete: (categoryId: number) => void;
	onToggleActive: (categoryId: number, isActive: boolean) => void;
}

export function CategoryDetail({
	category,
	onEdit,
	onDelete,
	onToggleActive,
}: CategoryDetailProps) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const { displayName, displayDescription } = useEntityDisplay(
		category.translations,
	);

	const availableItemCount = category.items.filter((i) => i.isAvailable).length;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h2 className="truncate font-semibold text-xl">{displayName}</h2>
						{!category.isActive && (
							<span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
								<EyeOff className="h-3.5 w-3.5" />
								{t("labels.hidden")}
							</span>
						)}
					</div>
					{displayDescription && (
						<p className="mt-1 text-muted-foreground text-sm">
							{displayDescription}
						</p>
					)}
					<p className="mt-2 text-muted-foreground text-sm">
						{category.items.length}{" "}
						{category.items.length === 1
							? tCommon("labels.item")
							: tCommon("labels.items")}
						{availableItemCount < category.items.length && (
							<span className="ms-1">
								({availableItemCount} {t("labels.available")})
							</span>
						)}
					</p>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon">
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => onEdit(category)}>
							<Pencil className="me-2 size-4" />
							{tCommon("buttons.edit")}
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => onToggleActive(category.id, !category.isActive)}
						>
							<Power className="me-2 size-4" />
							{category.isActive
								? tCommon("buttons.hide")
								: tCommon("buttons.show")}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-destructive"
							onClick={() => onDelete(category.id)}
						>
							<Trash2 className="me-2 size-4" />
							{tCommon("buttons.delete")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Future: Category configuration section (timing, visibility settings, etc.) */}

			{/* Edit button */}
			<div className="border-t pt-4">
				<Button onClick={() => onEdit(category)} className="w-full">
					<Pencil className="me-2 size-4" />
					{t("titles.editCategory")}
				</Button>
			</div>
		</div>
	);
}
