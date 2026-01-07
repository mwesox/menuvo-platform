import { EyeOff, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
	SelectableItem,
	SelectableItemActions,
	SelectableItemContent,
	SelectableItemMedia,
	SelectableItemTitle,
} from "@/components/ui/selectable-item";
import type { OptionChoice, OptionGroup, OptionGroupType } from "@/db/schema";
import { useEntityDisplayName } from "@/features/console/menu/hooks";
import { cn } from "@/lib/utils";

type OptionGroupWithChoices = OptionGroup & { choices: OptionChoice[] };

interface OptionGroupListItemProps {
	optionGroup: OptionGroupWithChoices;
	isSelected: boolean;
	onSelect: (id: string) => void;
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

export function OptionGroupListItem({
	optionGroup,
	isSelected,
	onSelect,
}: OptionGroupListItemProps) {
	const { t } = useTranslation("menu");
	const displayName = useEntityDisplayName(optionGroup.translations);
	const choiceCount = optionGroup.choices.length;

	return (
		<SelectableItem variant={isSelected ? "selected" : "default"} asChild>
			<button type="button" onClick={() => onSelect(optionGroup.id)}>
				<SelectableItemMedia variant="icon">
					<ListChecks className="size-4" />
				</SelectableItemMedia>

				<SelectableItemContent>
					<div className="flex items-center gap-2">
						<SelectableItemTitle
							className={cn(!optionGroup.isActive && "text-muted-foreground")}
						>
							{displayName}
						</SelectableItemTitle>
						{!optionGroup.isActive && (
							<EyeOff className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
						)}
					</div>
					<div className="mt-0.5 flex items-center gap-2">
						<Badge
							variant={getTypeBadgeVariant(optionGroup.type)}
							className="px-1.5 py-0 text-[10px]"
						>
							{getTypeLabel(t, optionGroup.type)}
						</Badge>
						{optionGroup.isRequired && (
							<span className="font-medium text-[10px] text-foreground">
								{t("optionGroups.required")}
							</span>
						)}
					</div>
				</SelectableItemContent>

				<SelectableItemActions>
					<Badge variant="secondary" className="tabular-nums">
						{choiceCount}
					</Badge>
				</SelectableItemActions>
			</button>
		</SelectableItem>
	);
}
