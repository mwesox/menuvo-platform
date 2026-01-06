import {
	ChevronDown,
	ChevronRight,
	Minus,
	Plus,
	RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
	CategoryComparison,
	DiffAction,
	ItemComparison,
	MenuComparisonData,
} from "../types";

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
				<Badge variant="default" className="gap-1">
					<Plus className="size-3" /> {t("import.badges.new")}
				</Badge>
			);
		case "update":
			return (
				<Badge variant="secondary" className="gap-1">
					<RefreshCw className="size-3" /> {t("import.badges.update")}
				</Badge>
			);
		case "skip":
			return (
				<Badge variant="outline" className="gap-1">
					<Minus className="size-3" /> {t("import.badges.skip")}
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
		<div className="space-y-4">
			{/* Toolbar */}
			<div className="flex items-center justify-between p-3 bg-muted rounded-lg">
				<div className="flex items-center gap-4">
					<Checkbox
						checked={selectedItems.size === totalSelectable}
						onCheckedChange={(checked) => {
							if (checked) onSelectAll();
							else onClearSelection();
						}}
					/>
					<span className="text-sm">
						{t("import.comparison.selectedCount", {
							selected: selectedItems.size,
							total: totalSelectable,
						})}
					</span>
				</div>
				<div className="flex gap-2 text-xs text-muted-foreground">
					<span>{t("import.comparison.newCount", { count: totalNew })}</span>
					<span>•</span>
					<span>
						{totalUpdates} {t("import.comparison.updates")}
					</span>
				</div>
			</div>

			{/* Categories and Items */}
			<ScrollArea className="h-[400px] pe-4">
				<div className="space-y-3">
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
						<div className="mt-6">
							<h3 className="text-sm font-medium mb-3">
								{t("import.comparison.optionGroups")}
							</h3>
							<div className="space-y-2">
								{comparison.optionGroups.map((og) => (
									<div
										key={og.extracted.name}
										className="flex items-center gap-3 p-3 border rounded-lg"
									>
										<Checkbox
											checked={selectedItems.has(
												`optionGroup:${og.extracted.name}`,
											)}
											onCheckedChange={() =>
												onToggleSelection(`optionGroup:${og.extracted.name}`)
											}
										/>
										<div className="flex-1">
											<span className="text-sm font-medium">
												{og.extracted.name}
											</span>
											<span className="text-xs text-muted-foreground ms-2">
												(
												{t("import.comparison.choicesCount", {
													count: og.extracted.choices.length,
												})}
												)
											</span>
										</div>
										<ActionBadge action={og.action} t={t} />
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</ScrollArea>

			{/* Summary */}
			<div className="border-t pt-4">
				<div className="grid grid-cols-3 gap-4 text-sm">
					<div>
						<p className="text-muted-foreground">
							{t("import.comparison.categories")}
						</p>
						<p className="font-medium">
							{t("import.comparison.summary", {
								newCount: comparison.summary.newCategories,
								updateCount: comparison.summary.updatedCategories,
							})}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground">
							{t("import.comparison.items")}
						</p>
						<p className="font-medium">
							{t("import.comparison.summary", {
								newCount: comparison.summary.newItems,
								updateCount: comparison.summary.updatedItems,
							})}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground">
							{t("import.comparison.optionGroups")}
						</p>
						<p className="font-medium">
							{t("import.comparison.summary", {
								newCount: comparison.summary.newOptionGroups,
								updateCount: comparison.summary.updatedOptionGroups,
							})}
						</p>
					</div>
				</div>
			</div>
		</div>
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
		<div className="border rounded-lg">
			<div className="flex items-center gap-3 p-3">
				<Checkbox
					checked={isCategorySelected}
					onCheckedChange={() => onToggleSelection(categoryKey)}
				/>
				<Button
					variant="ghost"
					size="icon"
					className="size-6"
					onClick={onToggleExpand}
				>
					{isExpanded ? (
						<ChevronDown className="size-4" />
					) : (
						<ChevronRight className="size-4" />
					)}
				</Button>
				<div className="flex-1">
					<span className="font-medium">{category.extracted.name}</span>
					{category.extracted.description && (
						<p className="text-xs text-muted-foreground line-clamp-1">
							{category.extracted.description}
						</p>
					)}
				</div>
				<span className="text-xs text-muted-foreground">
					{t("import.comparison.itemsCount", { count: category.items.length })}
				</span>
				<ActionBadge action={category.action} t={t} />
			</div>

			{isExpanded && category.items.length > 0 && (
				<div className="border-t px-3 py-2 space-y-2 bg-muted/30">
					{category.items.map((item) => (
						<ItemRow
							key={item.extracted.name}
							item={item}
							isSelected={selectedItems.has(`item:${item.extracted.name}`)}
							onToggle={() => onToggleSelection(`item:${item.extracted.name}`)}
							t={t}
						/>
					))}
				</div>
			)}
		</div>
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
		<div className="flex items-center gap-3 py-1 ps-8">
			<Checkbox checked={isSelected} onCheckedChange={onToggle} />
			<div className="flex-1 min-w-0">
				<span className="text-sm">{item.extracted.name}</span>
				{item.changes && item.changes.length > 0 && (
					<span className="text-xs text-muted-foreground ms-2">
						(
						{t("import.changes.fieldChanged", {
							fields: item.changes.map((c) => c.field).join(", "),
						})}
						)
					</span>
				)}
			</div>
			<span className="text-sm font-medium">
				{formatPrice(item.extracted.price)}
			</span>
			<ActionBadge action={item.action} t={t} />
		</div>
	);
}
