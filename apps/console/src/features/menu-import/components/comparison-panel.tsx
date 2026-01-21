import {
	Badge,
	Box,
	Button,
	Checkbox,
	HStack,
	Icon,
	ScrollArea,
	SimpleGrid,
	Text,
	VStack,
} from "@chakra-ui/react";
import {
	ChevronDown,
	ChevronRight,
	Minus,
	Plus,
	RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Caption, Label } from "@/components/ui/typography";
import type {
	CategoryComparison,
	DiffAction,
	ItemComparison,
	MenuComparisonData,
} from "../schemas";

interface ComparisonPanelProps {
	comparison: MenuComparisonData;
	selectedItems: Set<string>;
	onToggleSelection: (key: string) => void;
	onSelectAll: () => void;
	onClearSelection: () => void;
}

interface ActionBadgeProps {
	action: DiffAction;
	t: (key: string) => string;
}

function ActionBadge({ action, t }: ActionBadgeProps) {
	switch (action) {
		case "create":
			return (
				<Badge variant="solid" colorPalette="blue">
					<HStack gap="1">
						<Icon w="3" h="3">
							<Plus />
						</Icon>
						<Text>{t("import.badges.new")}</Text>
					</HStack>
				</Badge>
			);
		case "update":
			return (
				<Badge variant="subtle" colorPalette="gray">
					<HStack gap="1">
						<Icon w="3" h="3">
							<RefreshCw />
						</Icon>
						<Text>{t("import.badges.update")}</Text>
					</HStack>
				</Badge>
			);
		case "skip":
			return (
				<Badge variant="outline">
					<HStack gap="1">
						<Icon w="3" h="3">
							<Minus />
						</Icon>
						<Text>{t("import.badges.skip")}</Text>
					</HStack>
				</Badge>
			);
	}
}

function formatPrice(cents: number): string {
	return `€${(cents / 100).toFixed(2)}`;
}

export function ComparisonPanel({
	comparison,
	selectedItems,
	onToggleSelection,
	onSelectAll,
	onClearSelection,
}: ComparisonPanelProps) {
	const { t } = useTranslation("menu");
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set(comparison.categories.map((c) => c.extracted.name)),
	);

	const toggleExpanded = (categoryName: string) => {
		const newExpanded = new Set(expandedCategories);
		if (newExpanded.has(categoryName)) {
			newExpanded.delete(categoryName);
		} else {
			newExpanded.add(categoryName);
		}
		setExpandedCategories(newExpanded);
	};

	const totalSelectable =
		comparison.categories.length +
		comparison.categories.reduce((sum, c) => sum + c.items.length, 0) +
		comparison.optionGroups.length;

	const totalNew =
		comparison.summary.newCategories + comparison.summary.newItems;
	const totalUpdates =
		comparison.summary.updatedCategories + comparison.summary.updatedItems;

	return (
		<VStack gap="4" align="stretch">
			{/* Toolbar */}
			<HStack
				justify="space-between"
				align="center"
				rounded="lg"
				bg="bg.muted"
				p="3"
			>
				<HStack gap="4" align="center">
					<Checkbox.Root
						checked={selectedItems.size === totalSelectable}
						onCheckedChange={(details) => {
							if (details.checked) onSelectAll();
							else onClearSelection();
						}}
					>
						<Checkbox.HiddenInput />
						<Checkbox.Control>
							<Checkbox.Indicator />
						</Checkbox.Control>
					</Checkbox.Root>
					<Text textStyle="sm">
						{t("import.comparison.selectedCount", {
							selected: selectedItems.size,
							total: totalSelectable,
						})}
					</Text>
				</HStack>
				<HStack gap="2" color="fg.muted" textStyle="xs">
					<Text>{t("import.comparison.newCount", { count: totalNew })}</Text>
					<Text>•</Text>
					<Text>
						{totalUpdates} {t("import.comparison.updates")}
					</Text>
				</HStack>
			</HStack>

			{/* Categories and Items */}
			<ScrollArea.Root h="400px">
				<ScrollArea.Viewport pe="4">
					<ScrollArea.Content>
						<VStack gap="3" align="stretch">
							{comparison.categories.map((category) => (
								<CategoryCard
									key={category.extracted.name}
									category={category}
									isExpanded={expandedCategories.has(category.extracted.name)}
									onToggleExpand={() => toggleExpanded(category.extracted.name)}
									selectedItems={selectedItems}
									onToggleSelection={onToggleSelection}
									t={t}
								/>
							))}

							{comparison.optionGroups.length > 0 && (
								<Box mt="6">
									<Label mb="3">{t("import.comparison.optionGroups")}</Label>
									<VStack gap="2" align="stretch">
										{comparison.optionGroups.map((og) => (
											<HStack
												key={og.extracted.name}
												gap="3"
												align="center"
												rounded="lg"
												borderWidth="1px"
												p="3"
											>
												<Checkbox.Root
													checked={selectedItems.has(
														`optionGroup:${og.extracted.name}`,
													)}
													onCheckedChange={() =>
														onToggleSelection(
															`optionGroup:${og.extracted.name}`,
														)
													}
												>
													<Checkbox.HiddenInput />
													<Checkbox.Control>
														<Checkbox.Indicator />
													</Checkbox.Control>
												</Checkbox.Root>
												<Box flex="1">
													<Label>{og.extracted.name}</Label>
													<Text
														ms="2"
														color="fg.muted"
														textStyle="xs"
														as="span"
													>
														(
														{t("import.comparison.choicesCount", {
															count: og.extracted.choices.length,
														})}
														)
													</Text>
												</Box>
												<ActionBadge action={og.action} t={t} />
											</HStack>
										))}
									</VStack>
								</Box>
							)}
						</VStack>
					</ScrollArea.Content>
				</ScrollArea.Viewport>
				<ScrollArea.Scrollbar>
					<ScrollArea.Thumb />
				</ScrollArea.Scrollbar>
			</ScrollArea.Root>

			{/* Summary */}
			<Box borderTopWidth="1px" pt="4">
				<SimpleGrid columns={3} gap="4" textStyle="sm">
					<Box>
						<Caption>{t("import.comparison.categories")}</Caption>
						<Label>
							{t("import.comparison.summary", {
								newCount: comparison.summary.newCategories,
								updateCount: comparison.summary.updatedCategories,
							})}
						</Label>
					</Box>
					<Box>
						<Caption>{t("import.comparison.items")}</Caption>
						<Label>
							{t("import.comparison.summary", {
								newCount: comparison.summary.newItems,
								updateCount: comparison.summary.updatedItems,
							})}
						</Label>
					</Box>
					<Box>
						<Caption>{t("import.comparison.optionGroups")}</Caption>
						<Label>
							{t("import.comparison.summary", {
								newCount: comparison.summary.newOptionGroups,
								updateCount: comparison.summary.updatedOptionGroups,
							})}
						</Label>
					</Box>
				</SimpleGrid>
			</Box>
		</VStack>
	);
}

interface CategoryCardProps {
	category: CategoryComparison;
	isExpanded: boolean;
	onToggleExpand: () => void;
	selectedItems: Set<string>;
	onToggleSelection: (key: string) => void;
	t: (key: string, options?: Record<string, unknown>) => string;
}

function CategoryCard({
	category,
	isExpanded,
	onToggleExpand,
	selectedItems,
	onToggleSelection,
	t,
}: CategoryCardProps) {
	const categoryKey = `category:${category.extracted.name}`;
	const isCategorySelected = selectedItems.has(categoryKey);

	return (
		<Box rounded="lg" borderWidth="1px">
			<HStack gap="3" align="center" p="3">
				<Checkbox.Root
					checked={isCategorySelected}
					onCheckedChange={() => onToggleSelection(categoryKey)}
				>
					<Checkbox.HiddenInput />
					<Checkbox.Control>
						<Checkbox.Indicator />
					</Checkbox.Control>
				</Checkbox.Root>
				<Button
					variant="ghost"
					size="sm"
					w="6"
					h="6"
					p="0"
					onClick={onToggleExpand}
				>
					{isExpanded ? (
						<Icon w="4" h="4">
							<ChevronDown />
						</Icon>
					) : (
						<Icon w="4" h="4">
							<ChevronRight />
						</Icon>
					)}
				</Button>
				<Box flex="1">
					<Label>{category.extracted.name}</Label>
					{category.extracted.description && (
						<Text lineClamp={1} color="fg.muted" textStyle="xs">
							{category.extracted.description}
						</Text>
					)}
				</Box>
				<Text color="fg.muted" textStyle="xs">
					{t("import.comparison.itemsCount", { count: category.items.length })}
				</Text>
				<ActionBadge action={category.action} t={t} />
			</HStack>

			{isExpanded && category.items.length > 0 && (
				<VStack
					gap="2"
					align="stretch"
					borderTopWidth="1px"
					bg="bg.muted/30"
					px="3"
					py="2"
				>
					{category.items.map((item) => (
						<ItemRow
							key={item.extracted.name}
							item={item}
							isSelected={selectedItems.has(`item:${item.extracted.name}`)}
							onToggle={() => onToggleSelection(`item:${item.extracted.name}`)}
							t={t}
						/>
					))}
				</VStack>
			)}
		</Box>
	);
}

interface ItemRowProps {
	item: ItemComparison;
	isSelected: boolean;
	onToggle: () => void;
	t: (key: string, options?: Record<string, unknown>) => string;
}

function ItemRow({ item, isSelected, onToggle, t }: ItemRowProps) {
	return (
		<HStack gap="3" align="center" py="1" ps="8">
			<Checkbox.Root checked={isSelected} onCheckedChange={onToggle}>
				<Checkbox.HiddenInput />
				<Checkbox.Control>
					<Checkbox.Indicator />
				</Checkbox.Control>
			</Checkbox.Root>
			<Box minW="0" flex="1">
				<Text textStyle="sm" as="span">
					{item.extracted.name}
				</Text>
				{item.changes && item.changes.length > 0 && (
					<Text ms="2" color="fg.muted" textStyle="xs" as="span">
						(
						{t("import.changes.fieldChanged", {
							fields: item.changes.map((c) => c.field).join(", "),
						})}
						)
					</Text>
				)}
			</Box>
			<Label>{formatPrice(item.extracted.price)}</Label>
			<ActionBadge action={item.action} t={t} />
		</HStack>
	);
}
