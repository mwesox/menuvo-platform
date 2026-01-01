import {
	ChevronDown,
	MoreHorizontal,
	Pencil,
	Power,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import type { OptionChoice, OptionGroup } from "@/db/schema.ts";
import { cn } from "@/lib/utils.ts";

interface OptionGroupCardProps {
	optionGroup: OptionGroup & { optionChoices: OptionChoice[] };
	onToggleActive: (optionGroupId: number, isActive: boolean) => void;
	onEdit: (
		optionGroup: OptionGroup & { optionChoices: OptionChoice[] },
	) => void;
	onDelete: (optionGroupId: number) => void;
}

function formatPrice(cents: number, currency = "EUR"): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(cents / 100);
}

function formatPriceModifier(cents: number): string {
	if (cents === 0) return formatPrice(0);
	const prefix = cents > 0 ? "+" : "";
	return `${prefix}${formatPrice(cents)}`;
}

function getSelectionLabel(
	t: (
		key: string,
		options?: { count?: number; min?: number; max?: number },
	) => string,
	minSelections: number,
	maxSelections: number | null,
): string {
	if (minSelections === maxSelections && maxSelections !== null) {
		return t("optionGroups.selectExact", { count: minSelections });
	}
	if (minSelections > 0 && maxSelections !== null) {
		return t("optionGroups.selectRange", {
			min: minSelections,
			max: maxSelections,
		});
	}
	if (maxSelections !== null) {
		return t("optionGroups.selectUpTo", { max: maxSelections });
	}
	if (minSelections > 0) {
		return t("optionGroups.selectMin", { min: minSelections });
	}
	return t("optionGroups.optional");
}

export function OptionGroupCard({
	optionGroup,
	onToggleActive,
	onEdit,
	onDelete,
}: OptionGroupCardProps) {
	const { t } = useTranslation("menu");
	const [isExpanded, setIsExpanded] = useState(false);
	const choiceCount = optionGroup.optionChoices.length;

	return (
		<div
			className={cn(
				"group relative rounded-lg border bg-card",
				"transition-colors duration-150",
				"hover:bg-accent/50",
				!optionGroup.isActive && "opacity-60",
			)}
		>
			{/* Header */}
			<div className="p-4">
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<h3 className="font-medium text-foreground truncate">
								{optionGroup.name}
							</h3>
							{!optionGroup.isActive && (
								<span className="text-xs text-muted-foreground">
									{t("optionGroups.hidden")}
								</span>
							)}
						</div>
						{optionGroup.description && (
							<p className="mt-1 text-sm text-muted-foreground line-clamp-2">
								{optionGroup.description}
							</p>
						)}

						{/* Meta info */}
						<div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
							{optionGroup.isRequired && (
								<span className="text-foreground font-medium">
									{t("optionGroups.required")}
								</span>
							)}
							<span>
								{getSelectionLabel(
									t,
									optionGroup.minSelections,
									optionGroup.maxSelections,
								)}
							</span>
							<span>·</span>
							<span>
								{choiceCount}{" "}
								{choiceCount === 1
									? t("optionGroups.choice")
									: t("optionGroups.choices")}
							</span>
						</div>
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
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
							<DropdownMenuItem onClick={() => onEdit(optionGroup)}>
								<Pencil className="mr-2 h-4 w-4" />
								{t("itemCard.edit")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() =>
									onToggleActive(optionGroup.id, !optionGroup.isActive)
								}
							>
								<Power className="mr-2 h-4 w-4" />
								{optionGroup.isActive
									? t("optionGroups.hide")
									: t("optionGroups.show")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive"
								onClick={() => onDelete(optionGroup.id)}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								{t("itemCard.delete")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* Expandable choices */}
			{choiceCount > 0 && (
				<div className="border-t">
					<button
						type="button"
						onClick={() => setIsExpanded(!isExpanded)}
						className="w-full px-4 py-2 flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						<span>{t("optionGroups.viewChoices")}</span>
						<ChevronDown
							className={cn(
								"h-4 w-4 transition-transform",
								isExpanded && "rotate-180",
							)}
						/>
					</button>

					{isExpanded && (
						<div className="px-4 pb-3 space-y-1">
							{optionGroup.optionChoices.map((choice) => (
								<div
									key={choice.id}
									className="flex items-center justify-between py-1.5 text-sm"
								>
									<div className="flex items-center gap-2">
										<span
											className={cn(
												!choice.isAvailable &&
													"line-through text-muted-foreground",
											)}
										>
											{choice.name}
										</span>
										{!choice.isAvailable && (
											<span className="text-xs text-muted-foreground">
												{t("optionGroups.soldOut")}
											</span>
										)}
									</div>
									<span
										className={cn(
											"text-sm tabular-nums",
											choice.priceModifier > 0 && "text-foreground",
											choice.priceModifier < 0 && "text-muted-foreground",
											choice.priceModifier === 0 && "text-muted-foreground",
										)}
									>
										{formatPriceModifier(choice.priceModifier)}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
