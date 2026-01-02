import { EyeOff, ListChecks } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { OptionChoice, OptionGroup, OptionGroupType } from "@/db/schema";
import { useEntityDisplayName } from "@/features/console/menu/hooks";
import { cn } from "@/lib/utils";

type OptionGroupWithChoices = OptionGroup & { optionChoices: OptionChoice[] };

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
	const choiceCount = optionGroup.optionChoices.length;

	return (
		<button
			type="button"
			onClick={() => onSelect(optionGroup.id)}
			className={cn(
				"w-full text-left px-3 py-2.5 rounded-lg transition-colors",
				"hover:bg-accent/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				isSelected && "bg-accent",
			)}
		>
			<div className="flex items-center gap-3">
				<div
					className={cn(
						"flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
						isSelected ? "bg-primary text-primary-foreground" : "bg-muted",
					)}
				>
					<ListChecks className="h-4 w-4" />
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span
							className={cn(
								"font-medium truncate",
								!optionGroup.isActive && "text-muted-foreground",
							)}
						>
							{displayName}
						</span>
						{!optionGroup.isActive && (
							<EyeOff className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
						)}
					</div>
					<div className="flex items-center gap-2 mt-0.5">
						<Badge
							variant={getTypeBadgeVariant(optionGroup.type)}
							className="text-[10px] px-1.5 py-0"
						>
							{getTypeLabel(t, optionGroup.type)}
						</Badge>
						{optionGroup.isRequired && (
							<span className="text-[10px] text-foreground font-medium">
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
