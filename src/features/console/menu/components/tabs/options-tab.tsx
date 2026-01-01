import { ListChecks, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import type { OptionChoice, OptionGroup } from "@/db/schema";
import { OptionGroupCard } from "@/features/console/menu/components/option-group-card";
import { useToggleOptionGroupActive } from "@/features/console/menu/options.queries";

type OptionGroupWithChoices = OptionGroup & { optionChoices: OptionChoice[] };

interface OptionsTabProps {
	storeId: number;
	optionGroups: OptionGroupWithChoices[];
	onEdit: (optionGroup: OptionGroupWithChoices) => void;
	onDelete: (optionGroupId: number) => void;
	onAdd: () => void;
}

export function OptionsTab({
	storeId,
	optionGroups,
	onEdit,
	onDelete,
	onAdd,
}: OptionsTabProps) {
	const { t } = useTranslation("menu");
	const toggleActiveMutation = useToggleOptionGroupActive(storeId);

	if (optionGroups.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<ListChecks />
					</EmptyMedia>
					<EmptyTitle>{t("emptyStates.noOptionGroups")}</EmptyTitle>
					<EmptyDescription>
						{t("emptyStates.noOptionGroupsDescription")}
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button variant="outline" onClick={onAdd}>
						<Plus className="mr-2 h-4 w-4" />
						{t("titles.addOptionGroup")}
					</Button>
				</EmptyContent>
			</Empty>
		);
	}

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{optionGroups.map((optionGroup) => (
				<OptionGroupCard
					key={optionGroup.id}
					optionGroup={optionGroup}
					onToggleActive={(optionGroupId, isActive) =>
						toggleActiveMutation.mutate({ optionGroupId, isActive })
					}
					onEdit={onEdit}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}
