import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MasterDetailLayout } from "@/components/layout/master-detail-layout";
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
import { MenuActionBar } from "@/features/console/menu/components/menu-action-bar";
import { StoreSelectionPrompt } from "@/features/console/menu/components/store-selection-prompt";
import { useMenuPageState } from "@/features/console/menu/hooks";
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

const tabSchema = ["categories", "items", "options"] as const;
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
			<div className="flex flex-col h-full">
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
								<Plus className="mr-2 h-4 w-4" />
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
			<div className="flex flex-col h-full">
				<StoreSelectionPrompt stores={stores} />
			</div>
		);
	}

	// Render the main content with queries
	return (
		<MenuPageContent
			storeId={selectedStoreId}
			stores={stores}
			tab={tab}
			selected={selected}
		/>
	);
}

// Separate component for the main content - avoids conditional hooks issue
interface MenuPageContentProps {
	storeId: number;
	stores: Array<{ id: number; name: string }>;
	tab: TabValue;
	selected?: number;
}

function MenuPageContent({
	storeId,
	stores,
	tab,
	selected,
}: MenuPageContentProps) {
	const { t } = useTranslation("menu");
	const navigate = useNavigate();

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

	// Mutations
	const deleteCategoryMutation = useDeleteCategory(storeId);
	const deleteItemMutation = useDeleteItemByStore(storeId);
	const deleteOptionGroupMutation = useDeleteOptionGroup(storeId);
	const toggleCategoryActiveMutation = useToggleCategoryActive(storeId);
	const toggleItemAvailableMutation = useToggleItemAvailableByStore(storeId);
	const toggleOptionGroupActiveMutation = useToggleOptionGroupActive(storeId);

	// Navigation handlers
	const handleStoreChange = (newStoreId: number) => {
		navigate({
			to: "/console/menu",
			search: { storeId: newStoreId, tab, selected: undefined },
		});
	};

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

	// Get add action config
	const getAddAction = () => {
		switch (tab) {
			case "categories":
				return { onClick: categoryDialog.openCreate };
			case "items":
				return { href: `/console/menu/items/new?storeId=${storeId}` };
			case "options":
				return { onClick: optionGroupDialog.openCreate };
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
							<div className="p-4 text-center text-sm text-muted-foreground">
								{t("emptyStates.noCategories")}
							</div>
						)}
					</div>
				);
			case "items":
				return (
					<div className="space-y-1">
						{items.map((item) => (
							<ItemListItem
								key={item.id}
								item={item}
								isSelected={item.id === selected}
								onSelect={handleSelect}
							/>
						))}
						{items.length === 0 && (
							<div className="p-4 text-center text-sm text-muted-foreground">
								{t("emptyStates.noItems")}
							</div>
						)}
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
							<div className="p-4 text-center text-sm text-muted-foreground">
								{t("emptyStates.noOptionGroups")}
							</div>
						)}
					</div>
				);
		}
	};

	// Render detail panel content
	const renderDetailPanel = () => {
		if (!selected) {
			return <EmptySelection tab={tab} />;
		}

		switch (tab) {
			case "categories":
				if (!selectedCategory) return <EmptySelection tab={tab} />;
				return (
					<CategoryDetail
						category={selectedCategory}
						storeId={storeId}
						onEdit={categoryDialog.openEdit}
						onDelete={(id) => deleteConfirmation.open("category", id)}
						onToggleActive={(id, isActive) =>
							toggleCategoryActiveMutation.mutate({ categoryId: id, isActive })
						}
						onToggleItemAvailable={(id, isAvailable) =>
							toggleItemAvailableMutation.mutate({ itemId: id, isAvailable })
						}
						onDeleteItem={(id) => deleteConfirmation.open("item", id)}
					/>
				);
			case "items":
				if (!selectedItem) return <EmptySelection tab={tab} />;
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
				if (!selectedOptionGroup) return <EmptySelection tab={tab} />;
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
		categories: selectedCategory?.name ?? t("titles.categoryDetails"),
		items: selectedItem?.name ?? t("titles.itemDetails"),
		options: selectedOptionGroup?.name ?? t("titles.optionGroupDetails"),
	};

	return (
		<div className="flex flex-col h-full">
			{/* Action bar */}
			<MenuActionBar
				stores={stores}
				storeId={storeId}
				tab={tab}
				counts={{
					categories: categories.length,
					items: items.length,
					options: optionGroups.length,
				}}
				onStoreChange={handleStoreChange}
				onTabChange={handleTabChange}
				onAdd={addAction.onClick ?? (() => {})}
				addHref={"href" in addAction ? addAction.href : undefined}
			/>

			{/* Master-detail layout */}
			<div className="flex-1 mt-4 min-h-0">
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
		</div>
	);
}
