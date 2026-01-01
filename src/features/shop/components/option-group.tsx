"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { RequiredBadge, ShopHeading, ShopMutedText, ShopPrice } from "./ui";

interface OptionChoice {
	id: number;
	name: string;
	priceModifier: number; // in cents, can be 0, positive, or negative
	isDefault: boolean;
}

interface OptionGroupProps {
	group: {
		id: number;
		name: string;
		isRequired: boolean;
		minSelections: number;
		maxSelections: number | null; // null = unlimited
	};
	choices: OptionChoice[];
	selectedChoiceIds: number[];
	onSelectionChange: (choiceIds: number[]) => void;
}

/**
 * Get helper text for multi-select groups.
 */
function getHelperText(min: number, max: number | null): string | null {
	if (min === 1 && max === 1) return null; // Single select, no helper needed

	// Unlimited selections
	if (max === null) {
		if (min === 0) return null;
		return `Select at least ${min}`;
	}

	if (min === 0 && max === 1) {
		return "Select up to 1";
	}

	if (min === 0) {
		return `Select up to ${max}`;
	}

	if (min === max) {
		return `Select ${min}`;
	}

	return `Select ${min}-${max}`;
}

export function OptionGroup({
	group,
	choices,
	selectedChoiceIds,
	onSelectionChange,
}: OptionGroupProps) {
	const isSingleSelect = group.minSelections === 1 && group.maxSelections === 1;
	const helperText = getHelperText(group.minSelections, group.maxSelections);

	const handleRadioChange = (value: string) => {
		onSelectionChange([Number.parseInt(value, 10)]);
	};

	const handleCheckboxChange = (choiceId: number, checked: boolean) => {
		if (checked) {
			// Don't exceed max (unless unlimited)
			if (
				group.maxSelections !== null &&
				selectedChoiceIds.length >= group.maxSelections
			)
				return;
			onSelectionChange([...selectedChoiceIds, choiceId]);
		} else {
			// Don't go below min if required
			if (group.isRequired && selectedChoiceIds.length <= group.minSelections) {
				return;
			}
			onSelectionChange(selectedChoiceIds.filter((id) => id !== choiceId));
		}
	};

	return (
		<div className="py-4 border-b border-border/50 last:border-b-0">
			{/* Group Header */}
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<ShopHeading as="span" size="md">
						{group.name}
					</ShopHeading>
					{group.isRequired && <RequiredBadge />}
				</div>
				{helperText && (
					<ShopMutedText className="text-sm">{helperText}</ShopMutedText>
				)}
			</div>

			{/* Choices */}
			{isSingleSelect ? (
				<RadioGroup.Root
					value={selectedChoiceIds[0]?.toString() ?? ""}
					onValueChange={handleRadioChange}
					className="flex flex-col"
				>
					{choices.map((choice) => (
						<label
							key={choice.id}
							htmlFor={`choice-${choice.id}`}
							className="flex items-center justify-between py-2.5 cursor-pointer"
						>
							<div className="flex items-center gap-3">
								<RadioGroup.Item
									id={`choice-${choice.id}`}
									value={choice.id.toString()}
									className={cn(
										"w-5 h-5 rounded-full border-2 border-border",
										"data-[state=checked]:border-primary data-[state=checked]:bg-primary",
										"flex items-center justify-center transition-colors",
										"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
									)}
								>
									<RadioGroup.Indicator className="w-2 h-2 rounded-full bg-white" />
								</RadioGroup.Item>
								<span className="text-foreground">{choice.name}</span>
							</div>
							{choice.priceModifier !== 0 && (
								<ShopPrice
									cents={choice.priceModifier}
									variant="modifier"
									showPlus
								/>
							)}
						</label>
					))}
				</RadioGroup.Root>
			) : (
				<div className="flex flex-col">
					{choices.map((choice) => {
						const isSelected = selectedChoiceIds.includes(choice.id);
						const isAtMax =
							group.maxSelections !== null &&
							selectedChoiceIds.length >= group.maxSelections &&
							!isSelected;

						return (
							<label
								key={choice.id}
								htmlFor={`choice-${choice.id}`}
								className={cn(
									"flex items-center justify-between py-2.5 cursor-pointer",
									isAtMax && "opacity-50 cursor-not-allowed",
								)}
							>
								<div className="flex items-center gap-3">
									<Checkbox
										id={`choice-${choice.id}`}
										checked={isSelected}
										disabled={isAtMax}
										onCheckedChange={(checked) =>
											handleCheckboxChange(choice.id, checked === true)
										}
										className={cn(
											"w-5 h-5 rounded border-2 border-border",
											"data-[state=checked]:border-primary data-[state=checked]:bg-primary",
											"transition-colors",
										)}
									/>
									<span className="text-foreground">{choice.name}</span>
								</div>
								{choice.priceModifier !== 0 && (
									<ShopPrice
										cents={choice.priceModifier}
										variant="modifier"
										showPlus
									/>
								)}
							</label>
						);
					})}
				</div>
			)}
		</div>
	);
}
