import { Link } from "@tanstack/react-router";
import {
	EyeOff,
	ImageOff,
	MoreHorizontal,
	Pencil,
	Plus,
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
import { Switch } from "@/components/ui/switch";
import type { Category, Item } from "@/db/schema";
import { useDisplayLanguage } from "@/features/console/menu/contexts/display-language-context";
import { useEntityDisplay } from "@/features/console/menu/hooks";
import { getDisplayName } from "@/features/console/menu/logic/display";
import { cn } from "@/lib/utils";

type CategoryWithItems = Category & { items: Item[] };

interface CategoryDetailProps {
	category: CategoryWithItems;
	storeId: number;
	onEdit: (category: Category) => void;
	onDelete: (categoryId: number) => void;
	onToggleActive: (categoryId: number, isActive: boolean) => void;
	onToggleItemAvailable: (itemId: number, isAvailable: boolean) => void;
	onDeleteItem: (itemId: number) => void;
}

function formatPrice(cents: number, currency = "EUR"): string {
	return new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency,
	}).format(cents / 100);
}

export function CategoryDetail({
	category,
	storeId,
	onEdit,
	onDelete,
	onToggleActive,
	onToggleItemAvailable,
	onDeleteItem,
}: CategoryDetailProps) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const { displayName, displayDescription } = useEntityDisplay(
		category.translations,
	);
	const language = useDisplayLanguage();

	const availableItemCount = category.items.filter((i) => i.isAvailable).length;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<h2 className="text-xl font-semibold truncate">{displayName}</h2>
						{!category.isActive && (
							<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
								<EyeOff className="h-3.5 w-3.5" />
								{t("labels.hidden")}
							</span>
						)}
					</div>
					{displayDescription && (
						<p className="mt-1 text-sm text-muted-foreground">
							{displayDescription}
						</p>
					)}
					<p className="mt-2 text-sm text-muted-foreground">
						{category.items.length}{" "}
						{category.items.length === 1
							? tCommon("labels.item")
							: tCommon("labels.items")}
						{availableItemCount < category.items.length && (
							<span className="ml-1">
								({availableItemCount} {t("labels.available")})
							</span>
						)}
					</p>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon">
							<MoreHorizontal className="h-4 w-4" />
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

			{/* Items list */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-sm font-medium">{t("titles.items")}</h3>
					<Button variant="outline" size="sm" asChild>
						<Link
							to="/console/menu/items/new"
							search={{ storeId, categoryId: category.id }}
						>
							<Plus className="mr-2 h-3.5 w-3.5" />
							{t("titles.addItem")}
						</Link>
					</Button>
				</div>

				{category.items.length === 0 ? (
					<div className="rounded-lg border border-dashed p-6 text-center">
						<p className="text-sm text-muted-foreground">
							{t("emptyStates.noItemsInCategory")}
						</p>
						<Button variant="outline" size="sm" className="mt-3" asChild>
							<Link
								to="/console/menu/items/new"
								search={{ storeId, categoryId: category.id }}
							>
								<Plus className="mr-2 h-3.5 w-3.5" />
								{t("titles.addItem")}
							</Link>
						</Button>
					</div>
				) : (
					<div className="space-y-2">
						{category.items.map((item) => (
							<div
								key={item.id}
								className={cn(
									"flex items-center gap-3 p-3 rounded-lg border bg-card",
									"transition-colors hover:bg-accent/50",
									!item.isAvailable && "opacity-60",
								)}
							>
								{/* Thumbnail */}
								{item.imageUrl ? (
									<img
										src={item.imageUrl}
										alt={getDisplayName(item.translations, language)}
										className="h-12 w-12 rounded-md object-cover flex-shrink-0"
									/>
								) : (
									<div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
										<ImageOff className="h-4 w-4 text-muted-foreground" />
									</div>
								)}

								{/* Content */}
								<div className="flex-1 min-w-0">
									<Link
										to="/console/menu/items/$itemId"
										params={{ itemId: String(item.id) }}
										className="font-medium hover:underline truncate block"
									>
										{getDisplayName(item.translations, language)}
									</Link>
									<p className="text-sm text-muted-foreground">
										{formatPrice(item.price)}
									</p>
								</div>

								{/* Availability toggle */}
								<Switch
									checked={item.isAvailable}
									onCheckedChange={(checked) =>
										onToggleItemAvailable(item.id, checked)
									}
									className="flex-shrink-0"
								/>

								{/* Actions */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon" className="h-8 w-8">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem asChild>
											<Link
												to="/console/menu/items/$itemId"
												params={{ itemId: String(item.id) }}
											>
												<Pencil className="mr-2 h-4 w-4" />
												{tCommon("buttons.edit")}
											</Link>
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="text-destructive"
											onClick={() => onDeleteItem(item.id)}
										>
											<Trash2 className="mr-2 h-4 w-4" />
											{tCommon("buttons.delete")}
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
