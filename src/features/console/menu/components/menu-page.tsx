import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Filter, Plus, Store } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MasterDetailLayout } from "@/components/layout/master-detail-layout";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	CategoryDetail,
	EmptySelection,
	ItemDetail,
	OptionGroupDetail,
} from "@/features/console/menu/components/detail-panels";
import {
	CategoryDialogWrapper,
	DeleteConfirmationDialog,
	OptionGroupDialogWrapper,
} from "@/features/console/menu/components/dialogs";
import {
	CategoryListItem,
	ItemListItem,
	OptionGroupListItem,
} from "@/features/console/menu/components/master-lists";
import { StoreSelectionPrompt } from "@/features/console/menu/components/store-selection-prompt";
import { useDisplayLanguage } from "@/features/console/menu/contexts/display-language-context";
import { useMenuPageState } from "@/features/console/menu/hooks";
import { getDisplayName } from "@/features/console/menu/logic/display";
import {
	optionGroupQueries,
	useDeleteOptionGroup,
	useToggleOptionGroupActive,
} from "@/features/console/menu/options.queries";
import {
	categoryQueries,
	itemQueries,
	useDeleteCategory,
	useDeleteItemByStore,
	useToggleCategoryActive,
	useToggleItemAvailableByStore,
} from "@/features/console/menu/queries";
import { ImportWizard } from "@/features/console/menu-import/components/import-wizard";
import { TranslationsTab } from "@/features/console/translations/components";

const tabSchema = [
	"categories",
	"items",
	"options",
	"translations",
	"import",
] as const;
type TabValue = (typeof tabSchema)[number];

interface MenuPageProps {
	search: {
		storeId?: number;
		tab?: TabValue;
		selected?: number;
	};
	loaderData: {
		stores: Array<{ id: number; name: string }>;
		autoSelectedStoreId: number | undefined;
	};
}

export function MenuPage({ search, loaderData }: MenuPageProps) {
	const { t } = useTranslation("menu");
	const { storeId, tab = "categories", selected } = search;
	const { stores, autoSelectedStoreId } = loaderData;

	const selectedStoreId = storeId ?? autoSelectedStoreId;

	// No stores - show empty state
	if (stores.length === 0) {
		return (
			<div className="flex h-full flex-col">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<Store />
						</EmptyMedia>
						<EmptyTitle>{t("emptyStates.noStores")}</EmptyTitle>
						<EmptyDescription>
							{t("emptyStates.noStoresDescription")}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button variant="outline" asChild>
							<Link to="/console/stores/new">
								<Plus className="me-2 size-4" />
								{t("actions.createStore")}
							</Link>
						</Button>
					</EmptyContent>
				</Empty>
			</div>
		);
	}

	// Multiple stores with none selected - show selection prompt
	if (!selectedStoreId) {
		return (
			<div className="flex h-full flex-col">
				<StoreSelectionPrompt stores={stores} />
			</div>
		);
	}

	// Render the main content with queries
	return (
		<MenuPageContent storeId={selectedStoreId} tab={tab} selected={selected} />
	);
}

// Separate component for the main content - avoids conditional hooks issue
interface MenuPageContentProps {
	storeId: number;
	tab: TabValue;
	selected?: number;
}

function MenuPageContent({ storeId, tab, selected }: MenuPageContentProps) {
	const { t } = useTranslation("menu");
	const navigate = useNavigate();
	const language = useDisplayLanguage();

	// Centralized state management
	const { categoryDialog, optionGroupDialog, deleteConfirmation } =
		useMenuPageState();

	// Data queries
	const { data: categories } = useSuspenseQuery(
		categoryQueries.byStore(storeId),
	);
	const { data: items } = useSuspenseQuery(itemQueries.byStore(storeId));
	const { data: optionGroups } = useSuspenseQuery(
		optionGroupQueries.byStore(storeId),
	);

	// Category filter for Items tab
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const filteredItems =
		categoryFilter === "all"
			? items
			: items.filter((item) => item.categoryId === Number(categoryFilter));

	// Mutations
	const deleteCategoryMutation = useDeleteCategory(storeId);
	const deleteItemMutation = useDeleteItemByStore(storeId);
	const deleteOptionGroupMutation = useDeleteOptionGroup(storeId);
	const toggleCategoryActiveMutation = useToggleCategoryActive(storeId);
	const toggleItemAvailableMutation = useToggleItemAvailableByStore(storeId);
	const toggleOptionGroupActiveMutation = useToggleOptionGroupActive(storeId);

	// Navigation handlers
	const handleTabChange = (newTab: TabValue) => {
		navigate({
			to: "/console/menu",
			search: { storeId, tab: newTab, selected: undefined },
		});
	};

	const handleSelect = (id: number) => {
		navigate({
			to: "/console/menu",
			search: { storeId, tab, selected: id },
		});
	};

	const handleDetailClose = () => {
		navigate({
			to: "/console/menu",
			search: { storeId, tab, selected: undefined },
		});
	};

	// Get add action config (only for categories/items/options tabs)
	const getAddAction = () => {
		switch (tab) {
			case "categories":
				return { onClick: categoryDialog.openCreate };
			case "items":
				return { href: `/console/menu/items/new?storeId=${storeId}` };
			case "options":
				return { onClick: optionGroupDialog.openCreate };
			case "translations":
			case "import":
				return null;
		}
	};

	// Delete confirmation handler
	const handleDeleteConfirm = () => {
		if (!deleteConfirmation.id) return;

		const onSuccess = () => {
			deleteConfirmation.close();
			// Clear selection if deleted item was selected
			if (selected === deleteConfirmation.id) {
				handleDetailClose();
			}
		};

		switch (deleteConfirmation.type) {
			case "category":
				deleteCategoryMutation.mutate(deleteConfirmation.id, { onSuccess });
				break;
			case "item":
				deleteItemMutation.mutate(deleteConfirmation.id, { onSuccess });
				break;
			case "optionGroup":
				deleteOptionGroupMutation.mutate(deleteConfirmation.id, { onSuccess });
				break;
		}
	};

	const getDeleteDialogContent = () => {
		switch (deleteConfirmation.type) {
			case "category":
				return {
					title: t("titles.deleteCategory"),
					description: t("dialogs.deleteCategoryDescription"),
				};
			case "item":
				return {
					title: t("titles.deleteItem"),
					description: t("dialogs.deleteItemDescription"),
				};
			case "optionGroup":
				return {
					title: t("titles.deleteOptionGroup"),
					description: t("dialogs.deleteOptionGroupDescription"),
				};
			default:
				return { title: "", description: "" };
		}
	};

	// Find selected item
	const selectedCategory = categories.find((c) => c.id === selected);
	const selectedItem = items.find((i) => i.id === selected);
	const selectedOptionGroup = optionGroups.find((og) => og.id === selected);

	// Render master list content
	const renderMasterList = () => {
		switch (tab) {
			case "categories":
				return (
					<div className="space-y-1">
						{categories.map((category) => (
							<CategoryListItem
								key={category.id}
								category={category}
								isSelected={category.id === selected}
								onSelect={handleSelect}
							/>
						))}
						{categories.length === 0 && (
							<div className="p-4 text-center text-muted-foreground text-sm">
								{t("emptyStates.noCategories")}
							</div>
						)}
					</div>
				);
			case "items":
				return (
					<div className="space-y-2">
						{/* Category filter */}
						{categories.length > 0 && (
							<div className="px-3 py-2">
								<Select
									value={categoryFilter}
									onValueChange={setCategoryFilter}
								>
									<SelectTrigger className="w-full">
										<Filter className="me-2 size-4" />
										<SelectValue placeholder={t("filters.allCategories")} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											{t("filters.allCategories")}
										</SelectItem>
										{categories.map((category) => (
											<SelectItem key={category.id} value={String(category.id)}>
												{getDisplayName(category.translations, language)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}

						{/* Items list */}
						<div className="space-y-1">
							{filteredItems.map((item) => (
								<ItemListItem
									key={item.id}
									item={item}
									isSelected={item.id === selected}
									onSelect={handleSelect}
								/>
							))}
							{filteredItems.length === 0 && (
								<div className="p-4 text-center text-muted-foreground text-sm">
									{categoryFilter === "all"
										? t("emptyStates.noItems")
										: t("emptyStates.noItemsInCategory")}
								</div>
							)}
						</div>
					</div>
				);
			case "options":
				return (
					<div className="space-y-1">
						{optionGroups.map((optionGroup) => (
							<OptionGroupListItem
								key={optionGroup.id}
								optionGroup={optionGroup}
								isSelected={optionGroup.id === selected}
								onSelect={handleSelect}
							/>
						))}
						{optionGroups.length === 0 && (
							<div className="p-4 text-center text-muted-foreground text-sm">
								{t("emptyStates.noOptionGroups")}
							</div>
						)}
					</div>
				);
		}
	};

	// Render detail panel content (only called for master-detail tabs)
	const renderDetailPanel = () => {
		// This function is only called when tab is not "translations" or "import"
		// so we can safely cast to the master-detail tab types
		const safeTab = tab as Exclude<TabValue, "translations" | "import">;

		if (!selected) {
			return <EmptySelection tab={safeTab} />;
		}

		switch (tab) {
			case "categories":
				if (!selectedCategory) return <EmptySelection tab={safeTab} />;
				return (
					<CategoryDetail
						category={selectedCategory}
						onEdit={categoryDialog.openEdit}
						onDelete={(id) => deleteConfirmation.open("category", id)}
						onToggleActive={(id, isActive) =>
							toggleCategoryActiveMutation.mutate({ categoryId: id, isActive })
						}
					/>
				);
			case "items":
				if (!selectedItem) return <EmptySelection tab={safeTab} />;
				return (
					<ItemDetail
						item={selectedItem}
						onToggleAvailable={(id, isAvailable) =>
							toggleItemAvailableMutation.mutate({ itemId: id, isAvailable })
						}
						onDelete={(id) => deleteConfirmation.open("item", id)}
					/>
				);
			case "options":
				if (!selectedOptionGroup) return <EmptySelection tab={safeTab} />;
				return (
					<OptionGroupDetail
						optionGroup={selectedOptionGroup}
						onEdit={optionGroupDialog.openEdit}
						onDelete={(id) => deleteConfirmation.open("optionGroup", id)}
						onToggleActive={(id, isActive) =>
							toggleOptionGroupActiveMutation.mutate({
								optionGroupId: id,
								isActive,
							})
						}
					/>
				);
		}
	};

	const deleteDialogContent = getDeleteDialogContent();
	const addAction = getAddAction();

	// Sheet title based on tab
	const sheetTitles: Record<TabValue, string> = {
		categories:
			getDisplayName(selectedCategory?.translations, language) ||
			t("titles.categoryDetails"),
		items:
			getDisplayName(selectedItem?.translations, language) ||
			t("titles.itemDetails"),
		options:
			getDisplayName(selectedOptionGroup?.translations, language) ||
			t("titles.optionGroupDetails"),
		translations: t("titles.translations", "Translations"),
		import: t("titles.import", "KI Import"),
	};

	// Tab configuration for PageActionBar
	const tabItems = [
		{
			value: "categories" as const,
			label: t("titles.categories"),
			count: categories.length,
		},
		{
			value: "items" as const,
			label: t("titles.items"),
			count: items.length,
		},
		{
			value: "options" as const,
			label: t("titles.options"),
			count: optionGroups.length,
		},
		{
			value: "translations" as const,
			label: t("titles.translations", "Translations"),
			warning: false, // TODO: Add translation warning count
		},
		{
			value: "import" as const,
			label: t("titles.import", "KI Import"),
		},
	];

	// Get contextual add button label
	const addLabels: Record<
		Exclude<TabValue, "translations" | "import">,
		string
	> = {
		categories: t("titles.addCategory"),
		items: t("titles.addItem"),
		options: t("titles.addOptionGroup"),
	};

	return (
		<div className="flex h-full flex-col">
			{/* Action bar */}
			<PageActionBar
				title={t("pageTitle", "Speisekarte")}
				tabs={{
					items: tabItems,
					value: tab,
					onChange: (v) => handleTabChange(v as TabValue),
				}}
				actions={
					<>
						{/* Add button - hidden for translations and import tabs */}
						{tab !== "translations" &&
							tab !== "import" &&
							(addAction && "href" in addAction ? (
								<Button variant="default" asChild>
									<Link to={addAction.href}>
										<Plus className="me-2 size-4" />
										{
											addLabels[
												tab as Exclude<TabValue, "translations" | "import">
											]
										}
									</Link>
								</Button>
							) : addAction?.onClick ? (
								<Button variant="default" onClick={addAction.onClick}>
									<Plus className="me-2 size-4" />
									{
										addLabels[
											tab as Exclude<TabValue, "translations" | "import">
										]
									}
								</Button>
							) : null)}
					</>
				}
			/>

			{/* Translations tab has its own layout */}
			{tab === "translations" ? (
				<div className="mt-4 min-h-0 flex-1">
					<TranslationsTab storeId={storeId} />
				</div>
			) : tab === "import" ? (
				<div className="mt-4 min-h-0 flex-1">
					<ImportWizard
						storeId={storeId}
						onClose={() => handleTabChange("items")}
					/>
				</div>
			) : (
				<>
					{/* Master-detail layout */}
					<div className="mt-4 min-h-0 flex-1">
						<MasterDetailLayout
							master={renderMasterList()}
							detail={renderDetailPanel()}
							hasSelection={!!selected}
							onDetailClose={handleDetailClose}
							sheetTitle={sheetTitles[tab]}
							masterWidth="default"
						/>
					</div>

					{/* Dialogs */}
					<CategoryDialogWrapper
						storeId={storeId}
						open={categoryDialog.open}
						onOpenChange={(open) => {
							categoryDialog.setOpen(open);
							if (!open) categoryDialog.close();
						}}
						category={categoryDialog.editing}
					/>

					<OptionGroupDialogWrapper
						storeId={storeId}
						open={optionGroupDialog.open}
						onOpenChange={(open) => {
							optionGroupDialog.setOpen(open);
							if (!open) optionGroupDialog.close();
						}}
						optionGroup={optionGroupDialog.editing}
					/>

					<DeleteConfirmationDialog
						open={deleteConfirmation.type !== null}
						onOpenChange={(open) => !open && deleteConfirmation.close()}
						title={deleteDialogContent.title}
						description={deleteDialogContent.description}
						onConfirm={handleDeleteConfirm}
						isDeleting={
							deleteCategoryMutation.isPending ||
							deleteItemMutation.isPending ||
							deleteOptionGroupMutation.isPending
						}
					/>
				</>
			)}
		</div>
	);
}
