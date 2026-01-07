import { Link } from "@tanstack/react-router";
import { ImageOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import type { Item } from "@/db/schema.ts";
import { useEntityDisplay } from "@/features/console/menu/hooks";
import { cn } from "@/lib/utils.ts";

interface ItemCardProps {
	item: Item;
	onToggleAvailable: (itemId: string, isAvailable: boolean) => void;
	onDelete: (itemId: string) => void;
}

function formatPrice(cents: number, currency = "EUR"): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(cents / 100);
}

export function ItemCard({ item, onToggleAvailable, onDelete }: ItemCardProps) {
	const { t } = useTranslation("menu");
	const { displayName, displayDescription } = useEntityDisplay(
		item.translations,
	);
	const displayedAllergens = item.allergens?.slice(0, 3) ?? [];
	const remainingAllergens = (item.allergens?.length ?? 0) - 3;

	const handleDropdownClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	return (
		<div
			className={cn(
				"group relative rounded-lg border bg-card",
				"transition-colors duration-150",
				"hover:bg-accent/50",
				!item.isAvailable && "opacity-60",
			)}
		>
			<Link
				to="/console/menu/items/$itemId"
				params={{ itemId: String(item.id) }}
				className="block rounded-t-lg p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
			>
				<div className="flex gap-3">
					{/* Image */}
					<div className="flex-shrink-0">
						{item.imageUrl ? (
							<img
								src={item.imageUrl}
								alt={displayName}
								className="size-16 rounded-md object-cover"
							/>
						) : (
							<div className="flex size-16 items-center justify-center rounded-md bg-muted">
								<ImageOff className="size-5 text-muted-foreground" />
							</div>
						)}
					</div>

					{/* Content */}
					<div className="min-w-0 flex-1">
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0">
								<h3 className="truncate font-medium text-foreground">
									{displayName}
								</h3>
								<p className="font-medium text-muted-foreground text-sm">
									{formatPrice(item.price)}
								</p>
							</div>

							<DropdownMenu>
								<DropdownMenuTrigger asChild onClick={handleDropdownClick}>
									<Button
										variant="ghost"
										size="icon"
										className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
									>
										<MoreHorizontal className="size-4" />
										<span className="sr-only">Open menu</span>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem asChild>
										<Link
											to="/console/menu/items/$itemId"
											params={{ itemId: String(item.id) }}
										>
											<Pencil className="me-2 size-4" />
											{t("itemCard.edit")}
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-destructive"
										onClick={() => onDelete(item.id)}
									>
										<Trash2 className="me-2 size-4" />
										{t("itemCard.delete")}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{displayDescription && (
							<p className="mt-1 line-clamp-2 text-muted-foreground text-sm">
								{displayDescription}
							</p>
						)}

						{displayedAllergens.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-1">
								{displayedAllergens.map((allergen) => (
									<span
										key={allergen}
										className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs"
									>
										{t(`allergens.${allergen}`, allergen)}
									</span>
								))}
								{remainingAllergens > 0 && (
									<span className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs">
										+{remainingAllergens}
									</span>
								)}
							</div>
						)}
					</div>
				</div>
			</Link>

			{/* Availability toggle */}
			<div className="flex items-center justify-between px-4 pb-3">
				<span className="text-muted-foreground text-xs">
					{item.isAvailable
						? t("itemCard.available")
						: t("itemCard.unavailable")}
				</span>
				<Switch
					checked={item.isAvailable}
					onCheckedChange={(checked) => onToggleAvailable(item.id, checked)}
					className="scale-90"
				/>
			</div>
		</div>
	);
}
