import { EyeOff, MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
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
import type { OptionChoice, OptionGroup, OptionGroupType } from "@/db/schema";
import { useDisplayLanguage } from "@/features/console/menu/contexts/display-language-context";
import { useEntityDisplay } from "@/features/console/menu/hooks";
import { getDisplayName } from "@/features/console/menu/logic/display";
import { cn } from "@/lib/utils";

type OptionGroupWithChoices = OptionGroup & { optionChoices: OptionChoice[] };

interface OptionGroupDetailProps {
	optionGroup: OptionGroupWithChoices;
	onEdit: (optionGroup: OptionGroupWithChoices) => void;
	onDelete: (optionGroupId: number) => void;
	onToggleActive: (optionGroupId: number, isActive: boolean) => void;
}

function formatPrice(cents: number, currency = "EUR"): string {
	return new Intl.NumberFormat("de-DE", {
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
	if (type === "single_select") {
		return t("optionGroups.selectOne");
	}

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

	// multi_select
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

export function OptionGroupDetail({
	optionGroup,
	onEdit,
	onDelete,
	onToggleActive,
}: OptionGroupDetailProps) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const { displayName, displayDescription } = useEntityDisplay(
		optionGroup.translations,
	);
	const language = useDisplayLanguage();

	const availableChoices = optionGroup.optionChoices.filter(
		(c) => c.isAvailable,
	).length;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<h2 className="text-xl font-semibold truncate">{displayName}</h2>
						<Badge variant={getTypeBadgeVariant(optionGroup.type)}>
							{getTypeLabel(t, optionGroup.type)}
						</Badge>
						{!optionGroup.isActive && (
							<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
								<EyeOff className="h-3.5 w-3.5" />
								{t("optionGroups.hidden")}
							</span>
						)}
					</div>
					{displayDescription && (
						<p className="mt-1 text-sm text-muted-foreground">
							{displayDescription}
						</p>
					)}
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => onEdit(optionGroup)}>
							<Pencil className="mr-2 h-4 w-4" />
							{tCommon("buttons.edit")}
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() =>
								onToggleActive(optionGroup.id, !optionGroup.isActive)
							}
						>
							<Power className="mr-2 h-4 w-4" />
							{optionGroup.isActive
								? tCommon("buttons.hide")
								: tCommon("buttons.show")}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-destructive"
							onClick={() => onDelete(optionGroup.id)}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							{tCommon("buttons.delete")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Settings summary */}
			<div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">
						{t("optionGroups.requiredLabel")}
					</span>
					<span className="font-medium">
						{optionGroup.isRequired ? t("common.yes") : t("common.no")}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">
						{t("optionGroups.selectionRules")}
					</span>
					<span className="font-medium">
						{getSelectionLabel(
							t,
							optionGroup.type,
							optionGroup.minSelections,
							optionGroup.maxSelections,
							optionGroup.aggregateMinQuantity,
							optionGroup.aggregateMaxQuantity,
						)}
					</span>
				</div>
				{optionGroup.numFreeOptions > 0 && (
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">
							{t("optionGroups.freeOptionsLabel")}
						</span>
						<span className="font-medium text-green-600">
							{optionGroup.numFreeOptions}
						</span>
					</div>
				)}
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">
						{t("optionGroups.choicesCount")}
					</span>
					<span className="font-medium">
						{optionGroup.optionChoices.length} ({availableChoices}{" "}
						{t("labels.available")})
					</span>
				</div>
			</div>

			{/* Choices list */}
			<div>
				<h3 className="text-sm font-medium mb-3">
					{t("optionGroups.choices")} ({optionGroup.optionChoices.length})
				</h3>

				{optionGroup.optionChoices.length === 0 ? (
					<div className="rounded-lg border border-dashed p-6 text-center">
						<p className="text-sm text-muted-foreground">
							{t("optionGroups.noChoices")}
						</p>
					</div>
				) : (
					<div className="rounded-lg border divide-y">
						{optionGroup.optionChoices.map((choice) => (
							<div
								key={choice.id}
								className={cn(
									"flex items-center justify-between px-4 py-3",
									!choice.isAvailable && "opacity-60",
								)}
							>
								<div className="flex items-center gap-2">
									<span
										className={cn(
											"font-medium",
											!choice.isAvailable && "line-through",
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
										"text-sm font-medium tabular-nums",
										choice.priceModifier > 0 && "text-foreground",
										choice.priceModifier < 0 && "text-green-600",
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

			{/* Edit button */}
			<div className="pt-4 border-t">
				<Button onClick={() => onEdit(optionGroup)} className="w-full">
					<Pencil className="mr-2 h-4 w-4" />
					{t("optionGroups.editOptionGroup")}
				</Button>
			</div>
		</div>
	);
}
