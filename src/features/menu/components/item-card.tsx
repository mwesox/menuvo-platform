import { Link } from "@tanstack/react-router";
import { ImageOff, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import type { Item } from "@/db/schema";
import { cn } from "@/lib/utils";

interface ItemCardProps {
	item: Item;
	onToggleAvailable: (itemId: number, isAvailable: boolean) => void;
	onDelete: (itemId: number) => void;
}

function formatPrice(cents: number, currency = "EUR"): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(cents / 100);
}

export function ItemCard({ item, onToggleAvailable, onDelete }: ItemCardProps) {
	const { t } = useTranslation("menu");
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
				className="block p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-t-lg"
			>
				<div className="flex gap-3">
					{/* Image */}
					<div className="flex-shrink-0">
						{item.imageUrl ? (
							<img
								src={item.imageUrl}
								alt={item.name}
								className="h-16 w-16 rounded-md object-cover"
							/>
						) : (
							<div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
								<ImageOff className="h-5 w-5 text-muted-foreground" />
							</div>
						)}
					</div>

					{/* Content */}
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between gap-2">
							<div className="min-w-0">
								<h3 className="font-medium text-foreground truncate">
									{item.name}
								</h3>
								<p className="text-sm font-medium text-muted-foreground">
									{formatPrice(item.price)}
								</p>
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
									<DropdownMenuItem asChild>
										<Link
											to="/console/menu/items/$itemId"
											params={{ itemId: String(item.id) }}
										>
											<Pencil className="mr-2 h-4 w-4" />
											{t("itemCard.edit")}
										</Link>
									</DropdownMenuItem>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										className="text-destructive"
										onClick={() => onDelete(item.id)}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										{t("itemCard.delete")}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{item.description && (
							<p className="mt-1 text-sm text-muted-foreground line-clamp-2">
								{item.description}
							</p>
						)}

						{displayedAllergens.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-1">
								{displayedAllergens.map((allergen) => (
									<span
										key={allergen}
										className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
									>
										{allergen}
									</span>
								))}
								{remainingAllergens > 0 && (
									<span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
										+{remainingAllergens}
									</span>
								)}
							</div>
						)}
					</div>
				</div>
			</Link>

			{/* Availability toggle */}
			<div className="px-4 pb-3 flex items-center justify-between">
				<span className="text-xs text-muted-foreground">
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
