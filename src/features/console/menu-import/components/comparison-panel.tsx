import {
	ChevronDown,
	ChevronRight,
	Minus,
	Plus,
	RefreshCw,
} from "lucide-react";
import { useState } from "react";
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

function ActionBadge({ action }: { action: DiffAction }) {
	switch (action) {
		case "create":
			return (
				<Badge variant="default" className="gap-1">
					<Plus className="h-3 w-3" /> New
				</Badge>
			);
		case "update":
			return (
				<Badge variant="secondary" className="gap-1">
					<RefreshCw className="h-3 w-3" /> Update
				</Badge>
			);
		case "skip":
			return (
				<Badge variant="outline" className="gap-1">
					<Minus className="h-3 w-3" /> Skip
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
						{selectedItems.size} of {totalSelectable} selected
					</span>
				</div>
				<div className="flex gap-2 text-xs text-muted-foreground">
					<span>
						{comparison.summary.newCategories + comparison.summary.newItems} new
					</span>
					<span>•</span>
					<span>
						{comparison.summary.updatedCategories +
							comparison.summary.updatedItems}{" "}
						updates
					</span>
				</div>
			</div>

			{/* Categories and Items */}
			<ScrollArea className="h-[400px] pr-4">
				<div className="space-y-3">
					{comparison.categories.map((category) => (
						<CategoryCard
							key={category.extracted.name}
							category={category}
							isExpanded={expandedCategories.has(category.extracted.name)}
							onToggleExpand={() => toggleExpanded(category.extracted.name)}
							selectedItems={selectedItems}
							onToggleSelection={onToggleSelection}
						/>
					))}

					{comparison.optionGroups.length > 0 && (
						<div className="mt-6">
							<h3 className="text-sm font-medium mb-3">Option Groups</h3>
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
											<span className="text-xs text-muted-foreground ml-2">
												({og.extracted.choices.length} choices)
											</span>
										</div>
										<ActionBadge action={og.action} />
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
						<p className="text-muted-foreground">Categories</p>
						<p className="font-medium">
							{comparison.summary.newCategories} new,{" "}
							{comparison.summary.updatedCategories} updates
						</p>
					</div>
					<div>
						<p className="text-muted-foreground">Items</p>
						<p className="font-medium">
							{comparison.summary.newItems} new,{" "}
							{comparison.summary.updatedItems} updates
						</p>
					</div>
					<div>
						<p className="text-muted-foreground">Option Groups</p>
						<p className="font-medium">
							{comparison.summary.newOptionGroups} new,{" "}
							{comparison.summary.updatedOptionGroups} updates
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
}

function CategoryCard({
	category,
	isExpanded,
	onToggleExpand,
	selectedItems,
	onToggleSelection,
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
					className="h-6 w-6"
					onClick={onToggleExpand}
				>
					{isExpanded ? (
						<ChevronDown className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
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
					{category.items.length} items
				</span>
				<ActionBadge action={category.action} />
			</div>

			{isExpanded && category.items.length > 0 && (
				<div className="border-t px-3 py-2 space-y-2 bg-muted/30">
					{category.items.map((item) => (
						<ItemRow
							key={item.extracted.name}
							item={item}
							isSelected={selectedItems.has(`item:${item.extracted.name}`)}
							onToggle={() => onToggleSelection(`item:${item.extracted.name}`)}
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
}

function ItemRow({ item, isSelected, onToggle }: ItemRowProps) {
	return (
		<div className="flex items-center gap-3 py-1 pl-8">
			<Checkbox checked={isSelected} onCheckedChange={onToggle} />
			<div className="flex-1 min-w-0">
				<span className="text-sm">{item.extracted.name}</span>
				{item.changes && item.changes.length > 0 && (
					<span className="text-xs text-muted-foreground ml-2">
						({item.changes.map((c) => c.field).join(", ")} changed)
					</span>
				)}
			</div>
			<span className="text-sm font-medium">
				{formatPrice(item.extracted.price)}
			</span>
			<ActionBadge action={item.action} />
		</div>
	);
}
