import { Link } from "@tanstack/react-router";
import { ImageOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { Item } from "@/db/schema";
import { useEntityDisplay } from "@/features/console/menu/hooks";
import { cn } from "@/lib/utils";

interface ItemDetailProps {
	item: Item;
	onToggleAvailable: (itemId: number, isAvailable: boolean) => void;
	onDelete: (itemId: number) => void;
}

function formatPrice(cents: number, currency = "EUR"): string {
	return new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency,
	}).format(cents / 100);
}

export function ItemDetail({
	item,
	onToggleAvailable,
	onDelete,
}: ItemDetailProps) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const { displayName, displayDescription } = useEntityDisplay(
		item.translations,
	);

	return (
		<div className="space-y-6">
			{/* Header with image */}
			<div className="flex gap-4">
				{/* Large image */}
				<div className="flex-shrink-0">
					{item.imageUrl ? (
						<img
							src={item.imageUrl}
							alt={displayName}
							className="h-32 w-32 rounded-lg object-cover"
						/>
					) : (
						<div className="h-32 w-32 rounded-lg bg-muted flex items-center justify-center">
							<ImageOff className="h-8 w-8 text-muted-foreground" />
						</div>
					)}
				</div>

				{/* Info */}
				<div className="flex-1 min-w-0">
					<div className="flex items-start justify-between gap-2">
						<div>
							<h2
								className={cn(
									"text-xl font-semibold",
									!item.isAvailable && "text-muted-foreground",
								)}
							>
								{displayName}
							</h2>
							<p className="text-2xl font-bold mt-1">
								{formatPrice(item.price)}
							</p>
						</div>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon">
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
									onClick={() => onDelete(item.id)}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									{tCommon("buttons.delete")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Availability */}
					<div className="flex items-center gap-3 mt-4">
						<Switch
							checked={item.isAvailable}
							onCheckedChange={(checked) => onToggleAvailable(item.id, checked)}
						/>
						<span className="text-sm">
							{item.isAvailable
								? t("itemCard.available")
								: t("itemCard.unavailable")}
						</span>
					</div>
				</div>
			</div>

			{/* Description */}
			{displayDescription && (
				<div>
					<h3 className="text-sm font-medium mb-2">
						{t("labels.description")}
					</h3>
					<p className="text-sm text-muted-foreground">{displayDescription}</p>
				</div>
			)}

			{/* Allergens */}
			{item.allergens && item.allergens.length > 0 && (
				<div>
					<h3 className="text-sm font-medium mb-2">{t("labels.allergens")}</h3>
					<div className="flex flex-wrap gap-1.5">
						{item.allergens.map((allergen) => (
							<Badge key={allergen} variant="secondary">
								{t(`allergens.${allergen}`, allergen)}
							</Badge>
						))}
					</div>
				</div>
			)}

			{/* Edit button */}
			<div className="pt-4 border-t">
				<Button asChild className="w-full">
					<Link
						to="/console/menu/items/$itemId"
						params={{ itemId: String(item.id) }}
					>
						<Pencil className="mr-2 h-4 w-4" />
						{t("itemCard.editItem")}
					</Link>
				</Button>
			</div>
		</div>
	);
}
