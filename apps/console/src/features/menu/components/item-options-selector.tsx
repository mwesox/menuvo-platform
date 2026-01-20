import { Badge, Checkbox } from "@menuvo/ui";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useDisplayLanguage } from "@/features/menu/contexts/display-language-context";
import { getDisplayName } from "@/features/menu/logic/display";
import { useTRPC } from "@/lib/trpc";

interface ItemOptionsSelectorProps {
	storeId: string;
	selectedOptionGroupIds: string[];
	onSelectionChange: (optionGroupIds: string[]) => void;
}

export function ItemOptionsSelector({
	storeId,
	selectedOptionGroupIds,
	onSelectionChange,
}: ItemOptionsSelectorProps) {
	const { t } = useTranslation("menu");
	const trpc = useTRPC();
	const language = useDisplayLanguage();
	const { data: optionGroups = [] } = useQuery(
		trpc.menu.options.listGroups.queryOptions({ storeId }),
	);

	// Filter to only show active option groups
	const activeOptionGroups = optionGroups.filter((group) => group.isActive);

	const handleToggle = (optionGroupId: string, checked: boolean) => {
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
			{activeOptionGroups.map((group) => {
				const isSelected = selectedOptionGroupIds.includes(group.id);

				return (
					<div key={group.id} className="flex items-center gap-3">
						<Checkbox
							id={group.id}
							checked={isSelected}
							onCheckedChange={(checked) =>
								handleToggle(group.id, checked === true)
							}
						/>
						<label
							htmlFor={group.id}
							className="flex cursor-pointer items-center gap-2"
						>
							<span className="font-medium">
								{getDisplayName(group.translations, language)}
							</span>
							{group.isRequired && (
								<Badge variant="destructive">
									{t("optionGroups.required")}
								</Badge>
							)}
						</label>
					</div>
				);
			})}
		</div>
	);
}
