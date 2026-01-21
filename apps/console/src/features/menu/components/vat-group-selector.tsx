import { createListCollection, Portal, Select } from "@chakra-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useTRPC } from "@/lib/trpc";
import { formatVatRate } from "../vat.schemas";

interface VatGroupSelectorProps {
	value: string | null;
	onChange: (value: string | null) => void;
	/** Show "Inherit from category" option for items */
	showInheritOption?: boolean;
	/** Show "None" option to clear the VAT group (for categories) */
	showClearOption?: boolean;
	disabled?: boolean;
}

const INHERIT_VALUE = "__inherit__";
const CLEAR_VALUE = "__none__";

export function VatGroupSelector({
	value,
	onChange,
	showInheritOption = false,
	showClearOption = false,
	disabled = false,
}: VatGroupSelectorProps) {
	const { t } = useTranslation("menu");
	const trpc = useTRPC();

	const { data: vatGroups } = useSuspenseQuery(
		trpc.menu.vat.list.queryOptions(),
	);

	const handleValueChange = (selectedValue: string) => {
		if (selectedValue === INHERIT_VALUE || selectedValue === CLEAR_VALUE) {
			onChange(null);
		} else {
			onChange(selectedValue);
		}
	};

	// Convert null to appropriate placeholder for display
	const displayValue =
		value ??
		(showInheritOption ? INHERIT_VALUE : showClearOption ? CLEAR_VALUE : "");

	// Build collection
	const items = [
		...(showClearOption
			? [{ value: CLEAR_VALUE, label: t("vat.labels.noneSelected") }]
			: []),
		...(showInheritOption
			? [{ value: INHERIT_VALUE, label: t("vat.labels.inheritFromCategory") }]
			: []),
		...vatGroups.map((group) => ({
			value: group.id,
			label: `${group.name} (${formatVatRate(group.rate)})`,
		})),
	];

	const collection = createListCollection({ items });

	return (
		<Select.Root
			collection={collection}
			value={displayValue ? [displayValue] : []}
			onValueChange={(e) => handleValueChange(e.value[0] ?? "")}
			disabled={disabled}
		>
			<Select.HiddenSelect />
			<Select.Control>
				<Select.Trigger>
					<Select.ValueText placeholder={t("vat.labels.vatGroup")} />
					<Select.IndicatorGroup>
						<Select.Indicator />
					</Select.IndicatorGroup>
				</Select.Trigger>
			</Select.Control>
			<Portal>
				<Select.Positioner>
					<Select.Content>
						{collection.items.map((item) => (
							<Select.Item key={item.value} item={item}>
								{item.label}
								<Select.ItemIndicator />
							</Select.Item>
						))}
					</Select.Content>
				</Select.Positioner>
			</Portal>
		</Select.Root>
	);
}
