import type { OptionChoice, OptionGroup, OptionGroupType } from "@/db/schema";
import { OptionGroupDialog } from "@/features/console/menu/components/option-group-dialog";
import { useSaveOptionGroupWithChoices } from "@/features/console/menu/options.queries";

type OptionGroupWithChoices = OptionGroup & { optionChoices: OptionChoice[] };

interface OptionGroupDialogWrapperProps {
	storeId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	optionGroup: OptionGroupWithChoices | null;
}

export function OptionGroupDialogWrapper({
	storeId,
	open,
	onOpenChange,
	optionGroup,
}: OptionGroupDialogWrapperProps) {
	const saveMutation = useSaveOptionGroupWithChoices(storeId);

	const handleSave = async (data: {
		name: string;
		description?: string;
		type: OptionGroupType;
		minSelections: number;
		maxSelections: number | null;
		numFreeOptions: number;
		aggregateMinQuantity: number | null;
		aggregateMaxQuantity: number | null;
		choices: Array<{
			id?: number;
			name: string;
			priceModifier: number;
			isDefault: boolean;
			minQuantity: number;
			maxQuantity: number | null;
		}>;
	}) => {
		// Note: storeId is already captured in the mutation hook
		await saveMutation.mutateAsync({
			optionGroupId: optionGroup?.id,
			...data,
		});
	};

	return (
		<OptionGroupDialog
			open={open}
			onOpenChange={onOpenChange}
			optionGroup={optionGroup}
			onSave={handleSave}
		/>
	);
}
