import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { OptionGroup } from "@/db/schema";
import { cn } from "@/lib/utils";
import { optionGroupQueries } from "../options.queries";

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
				<p className="text-sm text-muted-foreground">
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
									isSelected && "bg-accent border-primary",
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
										<div className="flex items-center gap-2 flex-wrap">
											<span className="font-medium">{group.name}</span>
											{group.isRequired && (
												<Badge variant="destructive">
													{t("optionGroups.required")}
												</Badge>
											)}
										</div>
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
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
										{group.description && (
											<p className="text-sm text-muted-foreground">
												{truncateDescription(group.description)}
											</p>
										)}
									</div>
								</div>
							</Card>
						);
					},
				)}
			</div>

			<p className="text-sm text-muted-foreground">
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
