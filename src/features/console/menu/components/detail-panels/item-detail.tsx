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
	onToggleAvailable: (itemId: string, isAvailable: boolean) => void;
	onDelete: (itemId: string) => void;
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
						<div className="flex h-32 w-32 items-center justify-center rounded-lg bg-muted">
							<ImageOff className="size-8 text-muted-foreground" />
						</div>
					)}
				</div>

				{/* Info */}
				<div className="min-w-0 flex-1">
					<div className="flex items-start justify-between gap-2">
						<div>
							<h2
								className={cn(
									"font-semibold text-xl",
									!item.isAvailable && "text-muted-foreground",
								)}
							>
								{displayName}
							</h2>
							<p className="mt-1 font-bold text-2xl">
								{formatPrice(item.price)}
							</p>
						</div>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon">
									<MoreHorizontal className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<Link
										to="/console/menu/items/$itemId"
										params={{ itemId: String(item.id) }}
									>
										<Pencil className="me-2 size-4" />
										{tCommon("buttons.edit")}
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-destructive"
									onClick={() => onDelete(item.id)}
								>
									<Trash2 className="me-2 size-4" />
									{tCommon("buttons.delete")}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Availability */}
					<div className="mt-4 flex items-center gap-3">
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
					<h3 className="mb-2 font-medium text-sm">
						{t("labels.description")}
					</h3>
					<p className="text-muted-foreground text-sm">{displayDescription}</p>
				</div>
			)}

			{/* Allergens */}
			{item.allergens && item.allergens.length > 0 && (
				<div>
					<h3 className="mb-2 font-medium text-sm">{t("labels.allergens")}</h3>
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
			<div className="border-t pt-4">
				<Button asChild className="w-full">
					<Link
						to="/console/menu/items/$itemId"
						params={{ itemId: String(item.id) }}
					>
						<Pencil className="me-2 size-4" />
						{t("itemCard.editItem")}
					</Link>
				</Button>
			</div>
		</div>
	);
}
