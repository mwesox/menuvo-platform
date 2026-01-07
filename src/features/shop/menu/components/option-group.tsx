"use client";

import { Check, Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { MenuItemChoice, OptionGroupType } from "../../schemas";
import { formatPriceModifier } from "../../utils";

// ============================================================================
// Types
// ============================================================================

interface OptionGroupProps {
	group: {
		id: string;
		name: string;
		type: OptionGroupType;
		isRequired: boolean;
		minSelections: number;
		maxSelections: number | null;
		numFreeOptions: number;
		aggregateMinQuantity: number | null;
		aggregateMaxQuantity: number | null;
	};
	choices: MenuItemChoice[];
	/** For single/multi select: array of selected choice IDs */
	selectedChoiceIds: string[];
	/** For quantity select: map of choiceId -> quantity */
	quantitySelections: Map<string, number>;
	onSelectionChange: (choiceIds: string[]) => void;
	onQuantityChange: (choiceId: string, quantity: number) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getHelperText(
	type: OptionGroupType,
	min: number,
	max: number | null,
	isRequired: boolean,
	aggregateMin: number | null,
	aggregateMax: number | null,
	numFreeOptions: number,
	t: (key: string, options?: Record<string, unknown>) => string,
): string {
	// For quantity select, use aggregate constraints
	if (type === "quantity_select") {
		const parts: string[] = [];

		if (aggregateMin !== null && aggregateMax !== null) {
			if (aggregateMin === aggregateMax) {
				parts.push(t("menu.options.select", { count: aggregateMin }));
			} else {
				parts.push(
					t("menu.options.selectRange", {
						min: aggregateMin,
						max: aggregateMax,
					}),
				);
			}
		} else if (aggregateMin !== null) {
			parts.push(t("menu.options.atLeast", { count: aggregateMin }));
		} else if (aggregateMax !== null) {
			parts.push(t("menu.options.upTo", { count: aggregateMax }));
		} else {
			parts.push(t("menu.options.selectQuantities"));
		}

		if (numFreeOptions > 0) {
			parts.push(t("menu.options.free", { count: numFreeOptions }));
		}

		return parts.join(" · ");
	}

	// For single/multi select
	if (type === "single_select") {
		return isRequired ? t("menu.options.required") : t("menu.options.optional");
	}

	// Multi select
	let text: string;
	if (max === null) {
		if (min === 0) text = t("menu.options.optional");
		else text = t("menu.options.selectAtLeast", { count: min });
	} else if (min === 0 && max === 1) {
		text = t("menu.options.optional");
	} else if (min === 0) {
		text = t("menu.options.selectUpTo", { count: max });
	} else if (min === max) {
		text = t("menu.options.select", { count: min });
	} else {
		text = t("menu.options.selectRange", { min, max });
	}

	if (numFreeOptions > 0) {
		text += ` · ${t("menu.options.free", { count: numFreeOptions })}`;
	}

	return text;
}

// ============================================================================
// Single Select Group (Radio Buttons)
// ============================================================================

interface SingleSelectProps {
	group: OptionGroupProps["group"];
	choices: MenuItemChoice[];
	selectedId: string | null;
	onSelect: (choiceId: string) => void;
}

function SingleSelectGroup({
	group,
	choices,
	selectedId,
	onSelect,
}: SingleSelectProps) {
	const { t } = useTranslation("shop");

	return (
		<div className="space-y-2">
			{choices.map((choice) => {
				const isSelected = selectedId === choice.id;
				const isUnavailable = !choice.isAvailable;

				return (
					<label
						key={choice.id}
						htmlFor={`choice-${group.id}-${choice.id}`}
						className={cn(
							"flex cursor-pointer items-center justify-between rounded-xl p-3",
							"border-2 transition-all duration-150",
							isSelected
								? "border-primary bg-primary/5"
								: "border-border/60 bg-card hover:border-border",
							isUnavailable && "cursor-not-allowed opacity-50",
						)}
					>
						<div className="flex items-center gap-3">
							<input
								type="radio"
								id={`choice-${group.id}-${choice.id}`}
								name={`group-${group.id}`}
								checked={isSelected}
								disabled={isUnavailable}
								onChange={() => onSelect(choice.id)}
								className="peer sr-only"
							/>
							<div
								className={cn(
									"size-5 shrink-0 rounded-full border-2",
									"flex items-center justify-center transition-all duration-150",
									"peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
									isSelected ? "border-primary bg-primary" : "border-border",
								)}
							>
								{isSelected && <div className="size-2 rounded-full bg-white" />}
							</div>
							<span
								className={cn(
									"text-sm transition-colors",
									isSelected
										? "font-medium text-foreground"
										: "text-foreground",
									isUnavailable && "line-through",
								)}
							>
								{choice.name}
							</span>
							{isUnavailable && (
								<span className="text-muted-foreground text-xs">
									{t("menu.soldOut")}
								</span>
							)}
						</div>
						{choice.priceModifier !== 0 && (
							<span
								className={cn(
									"text-sm tabular-nums",
									isSelected ? "text-foreground" : "text-muted-foreground",
								)}
							>
								{formatPriceModifier(choice.priceModifier)}
							</span>
						)}
					</label>
				);
			})}
		</div>
	);
}

// ============================================================================
// Multi Select Group (Checkboxes)
// ============================================================================

interface MultiSelectProps {
	group: OptionGroupProps["group"];
	choices: MenuItemChoice[];
	selectedIds: string[];
	onToggle: (choiceId: string, checked: boolean) => void;
}

function MultiSelectGroup({
	group,
	choices,
	selectedIds,
	onToggle,
}: MultiSelectProps) {
	const { t } = useTranslation("shop");

	return (
		<div className="space-y-2">
			{choices.map((choice) => {
				const isSelected = selectedIds.includes(choice.id);
				const isUnavailable = !choice.isAvailable;
				const isAtMax =
					group.maxSelections !== null &&
					selectedIds.length >= group.maxSelections &&
					!isSelected;

				return (
					<label
						key={choice.id}
						htmlFor={`choice-${group.id}-${choice.id}`}
						className={cn(
							"flex cursor-pointer items-center justify-between rounded-xl p-3",
							"border-2 transition-all duration-150",
							isSelected
								? "border-primary bg-primary/5"
								: "border-border/60 bg-card hover:border-border",
							(isAtMax || isUnavailable) &&
								"cursor-not-allowed opacity-50 hover:border-border/60",
						)}
					>
						<div className="flex items-center gap-3">
							<input
								type="checkbox"
								id={`choice-${group.id}-${choice.id}`}
								checked={isSelected}
								disabled={isAtMax || isUnavailable}
								onChange={(e) => onToggle(choice.id, e.target.checked)}
								className="peer sr-only"
							/>
							<div
								className={cn(
									"size-5 shrink-0 rounded-md border-2",
									"flex items-center justify-center transition-all duration-150",
									"peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
									isSelected ? "border-primary bg-primary" : "border-border",
									(isAtMax || isUnavailable) && "opacity-50",
								)}
							>
								{isSelected && (
									<Check className="size-3 stroke-[3] text-white" />
								)}
							</div>
							<span
								className={cn(
									"text-sm transition-colors",
									isSelected
										? "font-medium text-foreground"
										: "text-foreground",
									isUnavailable && "line-through",
								)}
							>
								{choice.name}
							</span>
							{isUnavailable && (
								<span className="text-muted-foreground text-xs">
									{t("menu.soldOut")}
								</span>
							)}
						</div>
						{choice.priceModifier !== 0 && (
							<span
								className={cn(
									"text-sm tabular-nums",
									isSelected ? "text-foreground" : "text-muted-foreground",
								)}
							>
								{formatPriceModifier(choice.priceModifier)}
							</span>
						)}
					</label>
				);
			})}
		</div>
	);
}

// ============================================================================
// Quantity Select Group (Quantity Steppers)
// ============================================================================

interface QuantitySelectProps {
	group: OptionGroupProps["group"];
	choices: MenuItemChoice[];
	quantities: Map<string, number>;
	onQuantityChange: (choiceId: string, quantity: number) => void;
}

function QuantitySelectGroup({
	group,
	choices,
	quantities,
	onQuantityChange,
}: QuantitySelectProps) {
	const { t } = useTranslation("shop");
	const totalQuantity = Array.from(quantities.values()).reduce(
		(sum, qty) => sum + qty,
		0,
	);
	const isAtAggregateMax =
		group.aggregateMaxQuantity !== null &&
		totalQuantity >= group.aggregateMaxQuantity;

	return (
		<div className="space-y-2">
			{choices.map((choice) => {
				const quantity = quantities.get(choice.id) ?? 0;
				const isUnavailable = !choice.isAvailable;
				const choiceMax = choice.maxQuantity ?? 99;
				const isAtChoiceMax = quantity >= choiceMax;
				const canIncrement =
					!isUnavailable && !isAtChoiceMax && !isAtAggregateMax;
				const canDecrement = quantity > choice.minQuantity;

				return (
					<div
						key={choice.id}
						className={cn(
							"flex items-center justify-between rounded-xl p-3",
							"border-2 transition-all duration-150",
							quantity > 0
								? "border-primary bg-primary/5"
								: "border-border/60 bg-card",
							isUnavailable && "opacity-50",
						)}
					>
						<div className="flex min-w-0 flex-1 items-center gap-3">
							<span
								className={cn(
									"text-sm transition-colors",
									quantity > 0
										? "font-medium text-foreground"
										: "text-foreground",
									isUnavailable && "line-through",
								)}
							>
								{choice.name}
							</span>
							{isUnavailable && (
								<span className="text-muted-foreground text-xs">
									{t("menu.soldOut")}
								</span>
							)}
						</div>

						<div className="flex items-center gap-3">
							{choice.priceModifier !== 0 && (
								<span
									className={cn(
										"text-sm tabular-nums",
										quantity > 0 ? "text-foreground" : "text-muted-foreground",
									)}
								>
									{formatPriceModifier(choice.priceModifier)}
								</span>
							)}

							{/* Quantity stepper */}
							<div className="inline-flex items-center gap-1 rounded-full bg-muted p-0.5">
								<button
									type="button"
									onClick={() => onQuantityChange(choice.id, quantity - 1)}
									disabled={!canDecrement}
									aria-label={t("menu.options.decreaseQuantity", {
										name: choice.name,
									})}
									className={cn(
										"flex size-8 items-center justify-center rounded-full transition-colors",
										"hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
										"active:scale-95",
										!canDecrement &&
											"cursor-not-allowed opacity-30 hover:bg-transparent",
									)}
								>
									<Minus className="size-4" />
								</button>

								<span
									className={cn(
										"min-w-[2rem] text-center font-medium text-foreground text-sm tabular-nums",
									)}
									aria-live="polite"
									aria-atomic="true"
								>
									{quantity}
								</span>

								<button
									type="button"
									onClick={() => onQuantityChange(choice.id, quantity + 1)}
									disabled={!canIncrement}
									aria-label={t("menu.options.increaseQuantity", {
										name: choice.name,
									})}
									className={cn(
										"flex size-8 items-center justify-center rounded-full transition-colors",
										"hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
										"active:scale-95",
										!canIncrement &&
											"cursor-not-allowed opacity-30 hover:bg-transparent",
									)}
								>
									<Plus className="size-4" />
								</button>
							</div>
						</div>
					</div>
				);
			})}

			{/* Aggregate quantity indicator */}
			{(group.aggregateMinQuantity !== null ||
				group.aggregateMaxQuantity !== null) && (
				<div className="flex justify-end px-1 pt-1">
					<span className="text-muted-foreground text-xs tabular-nums">
						{t("menu.options.selected", { count: totalQuantity })}
						{group.aggregateMaxQuantity !== null && (
							<>
								{" "}
								/ {t("menu.options.max", { count: group.aggregateMaxQuantity })}
							</>
						)}
					</span>
				</div>
			)}
		</div>
	);
}

// ============================================================================
// Main OptionGroup Component
// ============================================================================

export function OptionGroup({
	group,
	choices,
	selectedChoiceIds,
	quantitySelections,
	onSelectionChange,
	onQuantityChange,
}: OptionGroupProps) {
	const { t } = useTranslation("shop");

	// Don't render if no choices
	if (choices.length === 0) return null;

	const helperText = getHelperText(
		group.type,
		group.minSelections,
		group.maxSelections,
		group.isRequired,
		group.aggregateMinQuantity,
		group.aggregateMaxQuantity,
		group.numFreeOptions,
		t,
	);

	const handleRadioChange = (choiceId: string) => {
		onSelectionChange([choiceId]);
	};

	const handleCheckboxChange = (choiceId: string, checked: boolean) => {
		if (checked) {
			if (
				group.maxSelections !== null &&
				selectedChoiceIds.length >= group.maxSelections
			)
				return;
			onSelectionChange([...selectedChoiceIds, choiceId]);
		} else {
			if (group.isRequired && selectedChoiceIds.length <= group.minSelections) {
				return;
			}
			onSelectionChange(selectedChoiceIds.filter((id) => id !== choiceId));
		}
	};

	return (
		<div className="py-4 first:pt-0">
			{/* Group Header */}
			<div className="mb-3 flex items-baseline justify-between">
				<h3
					className="font-medium text-base text-foreground"
					style={{ fontFamily: "var(--font-heading)" }}
				>
					{group.name}
				</h3>
				<span
					className={cn(
						"text-xs uppercase tracking-wide",
						group.isRequired
							? "font-medium text-primary"
							: "text-muted-foreground",
					)}
				>
					{helperText}
				</span>
			</div>

			{/* Type-specific rendering */}
			{group.type === "single_select" && (
				<SingleSelectGroup
					group={group}
					choices={choices}
					selectedId={selectedChoiceIds[0] ?? null}
					onSelect={handleRadioChange}
				/>
			)}

			{group.type === "multi_select" && (
				<MultiSelectGroup
					group={group}
					choices={choices}
					selectedIds={selectedChoiceIds}
					onToggle={handleCheckboxChange}
				/>
			)}

			{group.type === "quantity_select" && (
				<QuantitySelectGroup
					group={group}
					choices={choices}
					quantities={quantitySelections}
					onQuantityChange={onQuantityChange}
				/>
			)}
		</div>
	);
}
