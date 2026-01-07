import type {
	ChoiceTranslations,
	OptionChoice,
	OptionGroup,
	OptionGroupType,
} from "@/db/schema";
import { OptionGroupDialog } from "@/features/console/menu/components/option-group-dialog";
import { useDisplayLanguage } from "@/features/console/menu/contexts/display-language-context";
import { useSaveOptionGroupWithChoices } from "@/features/console/menu/options.queries";
import { formToTranslations } from "@/features/console/menu/schemas";

type OptionGroupWithChoices = OptionGroup & { choices: OptionChoice[] };

interface OptionGroupDialogWrapperProps {
	storeId: string;
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
	const language = useDisplayLanguage();
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
			id?: string;
			name: string;
			priceModifier: number;
			isDefault: boolean;
			minQuantity: number;
			maxQuantity: number | null;
		}>;
	}) => {
		// Convert form data to translations format
		const translations = formToTranslations(
			{ name: data.name, description: data.description ?? "" },
			language,
			optionGroup?.translations ?? undefined,
		);

		// Convert choice names to translations format
		const choicesWithTranslations = data.choices.map((choice, index) => {
			const existingChoice = optionGroup?.choices?.[index];
			const choiceTranslations: ChoiceTranslations = {
				...(existingChoice?.translations ?? {}),
				[language]: { name: choice.name },
			};
			return {
				id: choice.id,
				translations: choiceTranslations,
				priceModifier: choice.priceModifier,
				isDefault: choice.isDefault,
				minQuantity: choice.minQuantity,
				maxQuantity: choice.maxQuantity,
			};
		});

		await saveMutation.mutateAsync({
			optionGroupId: optionGroup?.id,
			translations,
			type: data.type,
			minSelections: data.minSelections,
			maxSelections: data.maxSelections,
			numFreeOptions: data.numFreeOptions,
			aggregateMinQuantity: data.aggregateMinQuantity,
			aggregateMaxQuantity: data.aggregateMaxQuantity,
			choices: choicesWithTranslations,
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
