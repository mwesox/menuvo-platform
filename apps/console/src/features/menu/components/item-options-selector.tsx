import { Badge, Box, Checkbox, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Caption, Label } from "@/components/ui/typography";
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
			<Box
				rounded="lg"
				borderWidth="1px"
				borderStyle="dashed"
				p="6"
				textAlign="center"
			>
				<Caption>{t("optionGroups.noOptionGroupsYet")}</Caption>
			</Box>
		);
	}

	return (
		<VStack gap="3" align="stretch">
			{activeOptionGroups.map((group) => {
				const isSelected = selectedOptionGroupIds.includes(group.id);

				return (
					<Checkbox.Root
						key={group.id}
						id={group.id}
						checked={isSelected}
						onCheckedChange={(e) => handleToggle(group.id, e.checked === true)}
					>
						<Checkbox.HiddenInput />
						<Checkbox.Control />
						<Checkbox.Label>
							<Box display="flex" alignItems="center" gap="2">
								<Label>{getDisplayName(group.translations, language)}</Label>
								{group.isRequired && (
									<Badge colorPalette="red">{t("optionGroups.required")}</Badge>
								)}
							</Box>
						</Checkbox.Label>
					</Checkbox.Root>
				);
			})}
		</VStack>
	);
}
