import { Link } from "@tanstack/react-router";
import {
	ChevronRight,
	MoreHorizontal,
	Pencil,
	Power,
	Trash2,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

interface CategoryCardProps {
	category: Category & { items: Item[] };
	storeId: number;
	onToggleActive: (categoryId: number, isActive: boolean) => void;
	onEdit: (category: Category) => void;
	onDelete: (categoryId: number) => void;
}

export function CategoryCard({
	category,
	storeId,
	onToggleActive,
	onEdit,
	onDelete,
}: CategoryCardProps) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const itemCount = category.items.length;
	const availableCount = category.items.filter((i) => i.isAvailable).length;

	const handleDropdownClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	return (
		<div
			className={cn(
				"group relative rounded-lg border bg-card p-4",
				"transition-colors duration-150",
				"hover:bg-accent/50",
				!category.isActive && "opacity-60",
			)}
		>
			<Link
				to="/console/menu/categories/$categoryId"
				params={{ categoryId: String(category.id) }}
				search={{ storeId }}
				className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
			>
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<h3 className="font-medium text-foreground truncate">
								{category.name}
							</h3>
							{!category.isActive && (
								<span className="text-xs text-muted-foreground">
									{t("labels.hidden")}
								</span>
							)}
						</div>
						{category.description && (
							<p className="mt-1 text-sm text-muted-foreground line-clamp-2">
								{category.description}
							</p>
						)}
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild onClick={handleDropdownClick}>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<MoreHorizontal className="h-4 w-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onEdit(category)}>
								<Pencil className="mr-2 h-4 w-4" />
								{tCommon("buttons.edit")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => onToggleActive(category.id, !category.isActive)}
							>
								<Power className="mr-2 h-4 w-4" />
								{category.isActive
									? tCommon("buttons.hide")
									: tCommon("buttons.show")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive"
								onClick={() => onDelete(category.id)}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								{tCommon("buttons.delete")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
					<span>
						{itemCount}{" "}
						{itemCount === 1 ? tCommon("labels.item") : tCommon("labels.items")}
						{itemCount > 0 && availableCount < itemCount && (
							<span className="text-xs ml-1">
								({availableCount} {t("labels.available")})
							</span>
						)}
					</span>
					<ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
				</div>
			</Link>
		</div>
	);
}
