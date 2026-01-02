import {
	ChevronDown,
	MoreHorizontal,
	Pencil,
	Power,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import type {
	OptionChoice,
	OptionGroup,
	OptionGroupType,
} from "@/db/schema.ts";
import { useDisplayLanguage } from "@/features/console/menu/contexts/display-language-context";
import {
	getDisplayDescription,
	getDisplayName,
} from "@/features/console/menu/logic/display";
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

function getTypeLabel(
	t: (key: string) => string,
	type: OptionGroupType,
): string {
	switch (type) {
		case "single_select":
			return t("optionTypes.singleSelect");
		case "multi_select":
			return t("optionTypes.multiSelect");
		case "quantity_select":
			return t("optionTypes.quantitySelect");
		default:
			return t("optionTypes.multiSelect");
	}
}

function getTypeBadgeVariant(
	type: OptionGroupType,
): "default" | "secondary" | "outline" {
	switch (type) {
		case "single_select":
			return "secondary";
		case "multi_select":
			return "outline";
		case "quantity_select":
			return "default";
		default:
			return "outline";
	}
}

function getSelectionLabel(
	t: (
		key: string,
		options?: { count?: number; min?: number; max?: number },
	) => string,
	type: OptionGroupType,
	minSelections: number,
	maxSelections: number | null,
	aggregateMinQuantity: number | null,
	aggregateMaxQuantity: number | null,
): string {
	// For single_select
	if (type === "single_select") {
		return t("optionGroups.selectOne");
	}

	// For quantity_select
	if (type === "quantity_select") {
		if (
			aggregateMinQuantity !== null &&
			aggregateMaxQuantity !== null &&
			aggregateMinQuantity === aggregateMaxQuantity
		) {
			return t("optionGroups.selectExact", { count: aggregateMinQuantity });
		}
		if (aggregateMinQuantity !== null && aggregateMaxQuantity !== null) {
			return t("optionGroups.selectRange", {
				min: aggregateMinQuantity,
				max: aggregateMaxQuantity,
			});
		}
		if (aggregateMaxQuantity !== null) {
			return t("optionGroups.selectUpTo", { max: aggregateMaxQuantity });
		}
		if (aggregateMinQuantity !== null) {
			return t("optionGroups.selectMin", { min: aggregateMinQuantity });
		}
		return t("optionGroups.selectQuantity");
	}

	// For multi_select
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
	const language = useDisplayLanguage();
	const [isExpanded, setIsExpanded] = useState(false);
	const choiceCount = optionGroup.optionChoices.length;
	const displayName = getDisplayName(optionGroup.translations, language);
	const displayDescription = getDisplayDescription(
		optionGroup.translations,
		language,
	);

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
					<button
						type="button"
						onClick={() => onEdit(optionGroup)}
						className="flex-1 min-w-0 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
					>
						<div className="flex items-center gap-2 flex-wrap">
							<h3 className="font-medium text-foreground truncate">
								{displayName}
							</h3>
							<Badge variant={getTypeBadgeVariant(optionGroup.type)}>
								{getTypeLabel(t, optionGroup.type)}
							</Badge>
							{!optionGroup.isActive && (
								<span className="text-xs text-muted-foreground">
									{t("optionGroups.hidden")}
								</span>
							)}
						</div>
						{displayDescription && (
							<p className="mt-1 text-sm text-muted-foreground line-clamp-2">
								{displayDescription}
							</p>
						)}

						{/* Meta info */}
						<div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
							{optionGroup.isRequired && (
								<span className="text-foreground font-medium">
									{t("optionGroups.required")}
								</span>
							)}
							<span>
								{getSelectionLabel(
									t,
									optionGroup.type,
									optionGroup.minSelections,
									optionGroup.maxSelections,
									optionGroup.aggregateMinQuantity,
									optionGroup.aggregateMaxQuantity,
								)}
							</span>
							<span>·</span>
							<span>
								{choiceCount}{" "}
								{choiceCount === 1
									? t("optionGroups.choice")
									: t("optionGroups.choices")}
							</span>
							{optionGroup.numFreeOptions > 0 && (
								<>
									<span>·</span>
									<span className="text-green-600 dark:text-green-500">
										{t("optionGroups.freeOptions", {
											count: optionGroup.numFreeOptions,
										})}
									</span>
								</>
							)}
						</div>
					</button>

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
											{getDisplayName(choice.translations, language)}
										</span>
										{choice.isDefault && (
											<Badge
												variant="secondary"
												className="text-[10px] px-1.5 py-0"
											>
												{t("optionGroups.default")}
											</Badge>
										)}
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
