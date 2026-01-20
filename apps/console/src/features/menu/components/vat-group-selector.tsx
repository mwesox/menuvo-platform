import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@menuvo/ui";
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

	return (
		<Select
			value={displayValue}
			onValueChange={handleValueChange}
			disabled={disabled}
		>
			<SelectTrigger>
				<SelectValue placeholder={t("vat.labels.vatGroup")} />
			</SelectTrigger>
			<SelectContent>
				{showClearOption && (
					<SelectItem value={CLEAR_VALUE}>
						{t("vat.labels.noneSelected")}
					</SelectItem>
				)}
				{showInheritOption && (
					<SelectItem value={INHERIT_VALUE}>
						{t("vat.labels.inheritFromCategory")}
					</SelectItem>
				)}
				{vatGroups.map((group) => (
					<SelectItem key={group.id} value={group.id}>
						{group.name} ({formatVatRate(group.rate)})
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
