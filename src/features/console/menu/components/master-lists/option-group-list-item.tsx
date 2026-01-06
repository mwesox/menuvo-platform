import { EyeOff, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { OptionChoice, OptionGroup, OptionGroupType } from "@/db/schema";
import { useEntityDisplayName } from "@/features/console/menu/hooks";
import { cn } from "@/lib/utils";

type OptionGroupWithChoices = OptionGroup & { choices: OptionChoice[] };

interface OptionGroupListItemProps {
	optionGroup: OptionGroupWithChoices;
	isSelected: boolean;
	onSelect: (id: number) => void;
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
		<button
			type="button"
			onClick={() => onSelect(optionGroup.id)}
			className={cn(
				"w-full rounded-lg px-3 py-2.5 text-start transition-colors",
				"hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				isSelected && "bg-accent",
			)}
		>
			<div className="flex items-center gap-3">
				<div
					className={cn(
						"flex size-8 flex-shrink-0 items-center justify-center rounded-md",
						isSelected ? "bg-primary text-primary-foreground" : "bg-muted",
					)}
				>
					<ListChecks className="size-4" />
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span
							className={cn(
								"truncate font-medium",
								!optionGroup.isActive && "text-muted-foreground",
							)}
						>
							{displayName}
						</span>
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
				</div>

				<Badge variant="secondary" className="flex-shrink-0 tabular-nums">
					{choiceCount}
				</Badge>
			</div>
		</button>
	);
}
