import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge.tsx";
import { Card } from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import type { OptionGroup } from "@/db/schema.ts";
import { useDisplayLanguage } from "@/features/console/menu/contexts/display-language-context";
import {
	getDisplayDescription,
	getDisplayName,
} from "@/features/console/menu/logic/display";
import { cn } from "@/lib/utils.ts";
import { optionGroupQueries } from "../options.queries.ts";

interface ItemOptionsSelectorProps {
	storeId: number;
	selectedOptionGroupIds: number[];
	onSelectionChange: (optionGroupIds: number[]) => void;
}

function getSelectionRuleDescription(
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

function truncateDescription(description: string, maxLength = 80): string {
	if (description.length <= maxLength) return description;
	return `${description.slice(0, maxLength).trim()}...`;
}

export function ItemOptionsSelector({
	storeId,
	selectedOptionGroupIds,
	onSelectionChange,
}: ItemOptionsSelectorProps) {
	const { t } = useTranslation("menu");
	const language = useDisplayLanguage();
	const { data: optionGroups } = useSuspenseQuery(
		optionGroupQueries.byStore(storeId),
	);

	// Filter to only show active option groups
	const activeOptionGroups = optionGroups.filter(
		(group: OptionGroup) => group.isActive,
	);

	const handleToggle = (optionGroupId: number, checked: boolean) => {
		const isCurrentlySelected = selectedOptionGroupIds.includes(optionGroupId);

		// Avoid unnecessary updates if state already matches
		if (checked === isCurrentlySelected) {
			return;
		}

		if (checked) {
			onSelectionChange([...selectedOptionGroupIds, optionGroupId]);
		} else {
			onSelectionChange(
				selectedOptionGroupIds.filter((id) => id !== optionGroupId),
			);
		}
	};

	if (activeOptionGroups.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-6 text-center">
				<p className="text-muted-foreground text-sm">
					{t("optionGroups.noOptionGroupsYet")}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="space-y-2">
				{activeOptionGroups.map(
					(group: OptionGroup & { optionChoices?: unknown[] }) => {
						const isSelected = selectedOptionGroupIds.includes(group.id);
						const choiceCount = group.optionChoices?.length ?? 0;

						return (
							<Card
								key={group.id}
								className={cn(
									"cursor-pointer p-4 transition-colors",
									isSelected && "border-primary bg-accent",
								)}
								onClick={() => handleToggle(group.id, !isSelected)}
							>
								<div className="flex items-start gap-3">
									<Checkbox
										checked={isSelected}
										onCheckedChange={(checked) =>
											handleToggle(group.id, checked === true)
										}
										onClick={(e) => e.stopPropagation()}
										className="mt-0.5"
									/>
									<div className="flex-1 space-y-1">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-medium">
												{getDisplayName(group.translations, language)}
											</span>
											{group.isRequired && (
												<Badge variant="destructive">
													{t("optionGroups.required")}
												</Badge>
											)}
										</div>
										<div className="flex items-center gap-2 text-muted-foreground text-sm">
											<span>
												{choiceCount}{" "}
												{choiceCount === 1
													? t("optionGroups.choice")
													: t("optionGroups.choices")}
											</span>
											<span>-</span>
											<span>
												{getSelectionRuleDescription(
													t,
													group.minSelections,
													group.maxSelections,
												)}
											</span>
										</div>
										{getDisplayDescription(group.translations, language) && (
											<p className="text-muted-foreground text-sm">
												{truncateDescription(
													getDisplayDescription(group.translations, language) ??
														"",
												)}
											</p>
										)}
									</div>
								</div>
							</Card>
						);
					},
				)}
			</div>

			<p className="text-muted-foreground text-sm">
				{selectedOptionGroupIds.length === 1
					? t("optionGroups.optionGroupsSelected", {
							count: selectedOptionGroupIds.length,
						})
					: t("optionGroups.optionGroupsSelectedPlural", {
							count: selectedOptionGroupIds.length,
						})}
			</p>
		</div>
	);
}
