import {
	Box,
	chakra,
	Flex,
	HStack,
	Stack,
	Text,
	VisuallyHidden,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuCheck, LuMinus, LuPlus } from "react-icons/lu";
import { focusRingProps, ShopHeading } from "../../shared/components/ui";
import { formatPriceModifier } from "../../utils";
import type { MenuItemChoice, MenuItemOptionGroup } from "../types";

// Styled native elements
const StyledLabel = chakra("label");
const StyledButton = chakra("button");

// ============================================================================
// Types
// ============================================================================

type OptionGroupType = MenuItemOptionGroup["type"];

interface OptionGroupProps {
	group: MenuItemOptionGroup;
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
		<Stack gap="2">
			{choices.map((choice) => {
				const isSelected = selectedId === choice.id;
				const isUnavailable = !choice.isAvailable;

				return (
					<StyledLabel
						key={choice.id}
						htmlFor={`choice-${group.id}-${choice.id}`}
						display="flex"
						alignItems="center"
						justifyContent="space-between"
						cursor={isUnavailable ? "not-allowed" : "pointer"}
						rounded="xl"
						p="3"
						borderWidth="2px"
						borderColor={isSelected ? "teal.solid" : "border.muted"}
						bg={isSelected ? "teal.subtle" : "bg.panel"}
						opacity={isUnavailable ? 0.5 : 1}
						transition="all 0.15s"
						_hover={
							!isUnavailable && !isSelected
								? { borderColor: "border" }
								: undefined
						}
					>
						<HStack gap="3">
							<VisuallyHidden>
								<input
									type="radio"
									id={`choice-${group.id}-${choice.id}`}
									name={`group-${group.id}`}
									checked={isSelected}
									disabled={isUnavailable}
									onChange={() => onSelect(choice.id)}
								/>
							</VisuallyHidden>
							<Flex
								w="5"
								h="5"
								flexShrink={0}
								rounded="full"
								borderWidth="2px"
								borderColor={isSelected ? "teal.solid" : "border"}
								bg={isSelected ? "teal.solid" : "transparent"}
								align="center"
								justify="center"
								transition="all 0.15s"
								{...focusRingProps}
							>
								{isSelected && <Box w="2" h="2" rounded="full" bg="white" />}
							</Flex>
							<Text
								fontSize="sm"
								fontWeight={isSelected ? "medium" : "normal"}
								color="fg"
								textDecoration={isUnavailable ? "line-through" : undefined}
								transition="colors 0.15s"
							>
								{choice.name}
							</Text>
							{isUnavailable && (
								<Text color="fg.muted" fontSize="xs">
									{t("menu.soldOut")}
								</Text>
							)}
						</HStack>
						{choice.priceModifier !== 0 && (
							<Text
								fontSize="sm"
								fontVariantNumeric="tabular-nums"
								color={isSelected ? "fg" : "fg.muted"}
							>
								{formatPriceModifier(choice.priceModifier)}
							</Text>
						)}
					</StyledLabel>
				);
			})}
		</Stack>
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
		<Stack gap="2">
			{choices.map((choice) => {
				const isSelected = selectedIds.includes(choice.id);
				const isUnavailable = !choice.isAvailable;
				const isAtMax =
					group.maxSelections !== null &&
					selectedIds.length >= group.maxSelections &&
					!isSelected;
				const isDisabled = isAtMax || isUnavailable;

				return (
					<StyledLabel
						key={choice.id}
						htmlFor={`choice-${group.id}-${choice.id}`}
						display="flex"
						alignItems="center"
						justifyContent="space-between"
						cursor={isDisabled ? "not-allowed" : "pointer"}
						rounded="xl"
						p="3"
						borderWidth="2px"
						borderColor={isSelected ? "teal.solid" : "border.muted"}
						bg={isSelected ? "teal.subtle" : "bg.panel"}
						opacity={isDisabled ? 0.5 : 1}
						transition="all 0.15s"
						_hover={
							!isDisabled && !isSelected ? { borderColor: "border" } : undefined
						}
					>
						<HStack gap="3">
							<VisuallyHidden>
								<input
									type="checkbox"
									id={`choice-${group.id}-${choice.id}`}
									checked={isSelected}
									disabled={isDisabled}
									onChange={(e) => onToggle(choice.id, e.target.checked)}
								/>
							</VisuallyHidden>
							<Flex
								w="5"
								h="5"
								flexShrink={0}
								rounded="md"
								borderWidth="2px"
								borderColor={isSelected ? "teal.solid" : "border"}
								bg={isSelected ? "teal.solid" : "transparent"}
								align="center"
								justify="center"
								transition="all 0.15s"
								opacity={isDisabled ? 0.5 : 1}
								{...focusRingProps}
							>
								{isSelected && (
									<Box as={LuCheck} boxSize="3" color="white" strokeWidth={3} />
								)}
							</Flex>
							<Text
								fontSize="sm"
								fontWeight={isSelected ? "medium" : "normal"}
								color="fg"
								textDecoration={isUnavailable ? "line-through" : undefined}
								transition="colors 0.15s"
							>
								{choice.name}
							</Text>
							{isUnavailable && (
								<Text color="fg.muted" fontSize="xs">
									{t("menu.soldOut")}
								</Text>
							)}
						</HStack>
						{choice.priceModifier !== 0 && (
							<Text
								fontSize="sm"
								fontVariantNumeric="tabular-nums"
								color={isSelected ? "fg" : "fg.muted"}
							>
								{formatPriceModifier(choice.priceModifier)}
							</Text>
						)}
					</StyledLabel>
				);
			})}
		</Stack>
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
		<Stack gap="2">
			{choices.map((choice) => {
				const quantity = quantities.get(choice.id) ?? 0;
				const isUnavailable = !choice.isAvailable;
				const choiceMax = choice.maxQuantity ?? 99;
				const isAtChoiceMax = quantity >= choiceMax;
				const canIncrement =
					!isUnavailable && !isAtChoiceMax && !isAtAggregateMax;
				const canDecrement = quantity > (choice.minQuantity ?? 0);

				return (
					<Flex
						key={choice.id}
						align="center"
						justify="space-between"
						rounded="xl"
						p="3"
						borderWidth="2px"
						borderColor={quantity > 0 ? "teal.solid" : "border.muted"}
						bg={quantity > 0 ? "teal.subtle" : "bg.panel"}
						opacity={isUnavailable ? 0.5 : 1}
						transition="all 0.15s"
					>
						<HStack gap="3" minW="0" flex="1">
							<Text
								fontSize="sm"
								fontWeight={quantity > 0 ? "medium" : "normal"}
								color="fg"
								textDecoration={isUnavailable ? "line-through" : undefined}
								transition="colors 0.15s"
							>
								{choice.name}
							</Text>
							{isUnavailable && (
								<Text color="fg.muted" fontSize="xs">
									{t("menu.soldOut")}
								</Text>
							)}
						</HStack>

						<HStack gap="3">
							{choice.priceModifier !== 0 && (
								<Text
									fontSize="sm"
									fontVariantNumeric="tabular-nums"
									color={quantity > 0 ? "fg" : "fg.muted"}
								>
									{formatPriceModifier(choice.priceModifier)}
								</Text>
							)}

							{/* Quantity stepper */}
							<HStack gap="1" rounded="xl" bg="bg.muted" p="0.5">
								<StyledButton
									type="button"
									onClick={() => onQuantityChange(choice.id, quantity - 1)}
									disabled={!canDecrement}
									aria-label={t("menu.options.decreaseQuantity", {
										name: choice.name,
									})}
									display="flex"
									alignItems="center"
									justifyContent="center"
									w="8"
									h="8"
									rounded="full"
									transition="colors 0.15s"
									cursor={!canDecrement ? "not-allowed" : "pointer"}
									opacity={!canDecrement ? 0.3 : 1}
									_hover={canDecrement ? { bg: "border" } : undefined}
									_active={
										canDecrement ? { transform: "scale(0.95)" } : undefined
									}
									{...focusRingProps}
								>
									<Box as={LuMinus} boxSize="4" />
								</StyledButton>

								<Text
									minW="8"
									textAlign="center"
									fontWeight="medium"
									fontSize="sm"
									fontVariantNumeric="tabular-nums"
									color="fg"
									aria-live="polite"
									aria-atomic="true"
								>
									{quantity}
								</Text>

								<StyledButton
									type="button"
									onClick={() => onQuantityChange(choice.id, quantity + 1)}
									disabled={!canIncrement}
									aria-label={t("menu.options.increaseQuantity", {
										name: choice.name,
									})}
									display="flex"
									alignItems="center"
									justifyContent="center"
									w="8"
									h="8"
									rounded="full"
									transition="colors 0.15s"
									cursor={!canIncrement ? "not-allowed" : "pointer"}
									opacity={!canIncrement ? 0.3 : 1}
									_hover={canIncrement ? { bg: "border" } : undefined}
									_active={
										canIncrement ? { transform: "scale(0.95)" } : undefined
									}
									{...focusRingProps}
								>
									<Box as={LuPlus} boxSize="4" />
								</StyledButton>
							</HStack>
						</HStack>
					</Flex>
				);
			})}

			{/* Aggregate quantity indicator */}
			{(group.aggregateMinQuantity !== null ||
				group.aggregateMaxQuantity !== null) && (
				<Flex justify="flex-end" px="1" pt="1">
					<Text
						color="fg.muted"
						fontSize="xs"
						fontVariantNumeric="tabular-nums"
					>
						{t("menu.options.selected", { count: totalQuantity })}
						{group.aggregateMaxQuantity !== null && (
							<>
								{" "}
								/ {t("menu.options.max", { count: group.aggregateMaxQuantity })}
							</>
						)}
					</Text>
				</Flex>
			)}
		</Stack>
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
		group.minSelections ?? 0,
		group.maxSelections,
		group.isRequired,
		group.aggregateMinQuantity,
		group.aggregateMaxQuantity,
		group.numFreeOptions ?? 0,
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
			if (
				group.isRequired &&
				selectedChoiceIds.length <= (group.minSelections ?? 0)
			) {
				return;
			}
			onSelectionChange(selectedChoiceIds.filter((id) => id !== choiceId));
		}
	};

	return (
		<Box py="4" _first={{ pt: "0" }}>
			{/* Group Header */}
			<Flex align="baseline" justify="space-between" mb="3">
				<ShopHeading as="h3" size="sm">
					{group.name}
				</ShopHeading>
				<Text
					fontSize="xs"
					textTransform="uppercase"
					letterSpacing="wide"
					fontWeight={group.isRequired ? "medium" : "normal"}
					color={group.isRequired ? "teal.solid" : "fg.muted"}
				>
					{helperText}
				</Text>
			</Flex>

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
		</Box>
	);
}
