import { skipToken, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Layers, ListChecks, Plus, Store, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Category, Item, OptionChoice, OptionGroup } from "@/db/schema";
import { CategoryCard } from "@/features/console/menu/components/category-card";
import { CategoryDialog } from "@/features/console/menu/components/category-dialog";
import { ItemCard } from "@/features/console/menu/components/item-card";
import { OptionGroupCard } from "@/features/console/menu/components/option-group-card";
import { OptionGroupDialog } from "@/features/console/menu/components/option-group-dialog";
import {
	optionGroupQueries,
	useCreateOptionGroup,
	useDeleteOptionGroup,
	useToggleOptionGroupActive,
	useUpdateOptionGroup,
} from "@/features/console/menu/options.queries";
import {
	categoryQueries,
	itemQueries,
	useCreateCategory,
	useDeleteCategory,
	useDeleteItemByStore,
	useToggleCategoryActive,
	useToggleItemAvailableByStore,
	useUpdateCategory,
} from "@/features/console/menu/queries";
import { storeQueries } from "@/features/console/stores/queries";

const tabSchema = z.enum(["categories", "items", "options"]);
type TabValue = z.infer<typeof tabSchema>;

const searchSchema = z.object({
	storeId: z.number().optional(),
	tab: tabSchema.optional().default("categories"),
});

export const Route = createFileRoute("/console/menu/")({
	validateSearch: searchSchema,
	loaderDeps: ({ search }) => ({ storeId: search.storeId, tab: search.tab }),
	loader: async ({ context, deps }) => {
		const stores = await context.queryClient.ensureQueryData(
			storeQueries.list(),
		);

		// Auto-select if single store, otherwise use URL param
		const effectiveStoreId =
			deps.storeId ?? (stores.length === 1 ? stores[0].id : undefined);

		if (effectiveStoreId) {
			await Promise.all([
				context.queryClient.ensureQueryData(
					categoryQueries.byStore(effectiveStoreId),
				),
				context.queryClient.ensureQueryData(
					itemQueries.byStore(effectiveStoreId),
				),
				context.queryClient.ensureQueryData(
					optionGroupQueries.byStore(effectiveStoreId),
				),
			]);
		}

		return {
			stores,
			autoSelectedStoreId: stores.length === 1 ? stores[0].id : undefined,
		};
	},
	component: MenuPage,
});

function MenuPage() {
	const { t } = useTranslation("menu");
	const navigate = useNavigate();
	const { storeId, tab = "categories" } = Route.useSearch();
	const { stores, autoSelectedStoreId } = Route.useLoaderData();

	const selectedStoreId = storeId ?? autoSelectedStoreId;

	// Category state - must be before early returns (React hooks rules)
	const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);
	const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);

	// Option group state
	const [optionGroupDialogOpen, setOptionGroupDialogOpen] = useState(false);
	const [editingOptionGroup, setEditingOptionGroup] = useState<
		(OptionGroup & { optionChoices: OptionChoice[] }) | null
	>(null);
	const [deleteOptionGroupId, setDeleteOptionGroupId] = useState<number | null>(
		null,
	);

	// Item state
	const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

	// Data queries - must be before early returns (React hooks rules)
	const { data: categories = [] } = useSuspenseQuery(
		selectedStoreId
			? categoryQueries.byStore(selectedStoreId)
			: { queryKey: ["categories", "disabled"], queryFn: skipToken },
	);
	const { data: items = [] } = useSuspenseQuery(
		selectedStoreId
			? itemQueries.byStore(selectedStoreId)
			: { queryKey: ["items", "disabled"], queryFn: skipToken },
	);
	const { data: optionGroups = [] } = useSuspenseQuery(
		selectedStoreId
			? optionGroupQueries.byStore(selectedStoreId)
			: { queryKey: ["optionGroups", "disabled"], queryFn: skipToken },
	);

	// No stores - show empty state
	if (stores.length === 0) {
		return (
			<div className="space-y-6">
				<PageHeader title={t("pageTitle")} description={t("pageDescription")} />
				<EmptyState
					icon={Store}
					title={t("emptyStates.noStores")}
					description={t("emptyStates.noStoresDescription")}
					action={{
						label: t("actions.createStore"),
						href: "/console/stores/new",
					}}
				/>
			</div>
		);
	}

	// Multiple stores with none selected - show selection prompt
	if (!selectedStoreId) {
		return (
			<div className="space-y-6">
				<PageHeader title={t("pageTitle")} description={t("pageDescription")} />
				<StoreSelectionPrompt stores={stores} />
			</div>
		);
	}

	const getActionConfig = () => {
		switch (tab) {
			case "categories":
				return {
					label: t("titles.addCategory"),
					onClick: () => {
						setEditingCategory(null);
						setCategoryDialogOpen(true);
					},
				};
			case "items":
				return {
					label: t("titles.addItem"),
					href: `/console/menu/items/new?storeId=${selectedStoreId}`,
				};
			case "options":
				return {
					label: t("titles.addOptionGroup"),
					onClick: () => {
						setEditingOptionGroup(null);
						setOptionGroupDialogOpen(true);
					},
				};
			default:
				return undefined;
		}
	};

	const handleStoreChange = (value: string) => {
		navigate({
			to: "/console/menu",
			search: { storeId: Number.parseInt(value, 10), tab },
		});
	};

	const handleTabChange = (value: string) => {
		navigate({
			to: "/console/menu",
			search: { storeId: selectedStoreId, tab: value as TabValue },
		});
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("pageTitle")}
				description={t("pageDescription")}
				action={getActionConfig()}
			/>

			{/* Store selector */}
			<div className="flex items-center gap-3">
				<Store className="h-4 w-4 text-muted-foreground" />
				<Select
					value={String(selectedStoreId)}
					onValueChange={handleStoreChange}
				>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder={t("labels.selectStore")} />
					</SelectTrigger>
					<SelectContent>
						{stores.map((store) => (
							<SelectItem key={store.id} value={String(store.id)}>
								{store.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Tabs value={tab} onValueChange={handleTabChange}>
				<TabsList>
					<TabsTrigger value="categories" className="gap-2">
						<Layers className="h-4 w-4" />
						{t("titles.categories")}
						<span className="text-xs text-muted-foreground ml-1">
							{categories.length}
						</span>
					</TabsTrigger>
					<TabsTrigger value="items" className="gap-2">
						<UtensilsCrossed className="h-4 w-4" />
						{t("titles.items")}
						<span className="text-xs text-muted-foreground ml-1">
							{items.length}
						</span>
					</TabsTrigger>
					<TabsTrigger value="options" className="gap-2">
						<ListChecks className="h-4 w-4" />
						{t("titles.options")}
						<span className="text-xs text-muted-foreground ml-1">
							{optionGroups.length}
						</span>
					</TabsTrigger>
				</TabsList>

				<div className="mt-6">
					<TabsContent value="categories" className="mt-0">
						<CategoriesTab
							storeId={selectedStoreId}
							categories={categories}
							onEdit={(category) => {
								setEditingCategory(category);
								setCategoryDialogOpen(true);
							}}
							onDelete={(categoryId) => setDeleteCategoryId(categoryId)}
							onAdd={() => {
								setEditingCategory(null);
								setCategoryDialogOpen(true);
							}}
						/>
					</TabsContent>

					<TabsContent value="items" className="mt-0">
						<ItemsTab
							storeId={selectedStoreId}
							items={items}
							onDelete={(itemId) => setDeleteItemId(itemId)}
						/>
					</TabsContent>

					<TabsContent value="options" className="mt-0">
						<OptionsTab
							storeId={selectedStoreId}
							optionGroups={optionGroups}
							onEdit={(optionGroup) => {
								setEditingOptionGroup(optionGroup);
								setOptionGroupDialogOpen(true);
							}}
							onDelete={(optionGroupId) =>
								setDeleteOptionGroupId(optionGroupId)
							}
							onAdd={() => {
								setEditingOptionGroup(null);
								setOptionGroupDialogOpen(true);
							}}
						/>
					</TabsContent>
				</div>
			</Tabs>

			{/* Dialogs */}
			<CategoryDialogWrapper
				storeId={selectedStoreId}
				open={categoryDialogOpen}
				onOpenChange={(open) => {
					setCategoryDialogOpen(open);
					if (!open) setEditingCategory(null);
				}}
				category={editingCategory}
			/>

			<DeleteCategoryDialog
				storeId={selectedStoreId}
				categoryId={deleteCategoryId}
				onOpenChange={(open) => !open && setDeleteCategoryId(null)}
			/>

			<OptionGroupDialogWrapper
				storeId={selectedStoreId}
				open={optionGroupDialogOpen}
				onOpenChange={(open) => {
					setOptionGroupDialogOpen(open);
					if (!open) setEditingOptionGroup(null);
				}}
				optionGroup={editingOptionGroup}
			/>

			<DeleteOptionGroupDialog
				storeId={selectedStoreId}
				optionGroupId={deleteOptionGroupId}
				onOpenChange={(open) => !open && setDeleteOptionGroupId(null)}
			/>

			<DeleteItemDialog
				storeId={selectedStoreId}
				itemId={deleteItemId}
				onOpenChange={(open) => !open && setDeleteItemId(null)}
			/>
		</div>
	);
}

function EmptyState({
	icon: Icon,
	title,
	description,
	action,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	description: string;
	action?: { label: string; onClick?: () => void; href?: string };
}) {
	return (
		<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
			<div className="rounded-full bg-muted p-3 mb-3">
				<Icon className="h-6 w-6 text-muted-foreground" />
			</div>
			<h3 className="font-medium">{title}</h3>
			<p className="mt-1 text-sm text-muted-foreground max-w-xs">
				{description}
			</p>
			{action && (
				<Button
					variant="outline"
					className="mt-4"
					asChild={!!action.href}
					onClick={action.onClick}
				>
					{action.href ? (
						<Link to={action.href}>
							<Plus className="mr-2 h-4 w-4" />
							{action.label}
						</Link>
					) : (
						<>
							<Plus className="mr-2 h-4 w-4" />
							{action.label}
						</>
					)}
				</Button>
			)}
		</div>
	);
}

function StoreSelectionPrompt({
	stores,
}: {
	stores: Array<{ id: number; name: string }>;
}) {
	const { t } = useTranslation("menu");
	const navigate = useNavigate();

	return (
		<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
			<div className="rounded-full bg-muted p-3 mb-3">
				<Store className="h-6 w-6 text-muted-foreground" />
			</div>
			<h3 className="font-medium">{t("emptyStates.selectStoreTitle")}</h3>
			<p className="mt-1 text-sm text-muted-foreground max-w-xs">
				{t("emptyStates.selectStoreDescription")}
			</p>
			<div className="mt-4 flex flex-wrap justify-center gap-2">
				{stores.map((store) => (
					<Button
						key={store.id}
						variant="outline"
						onClick={() =>
							navigate({
								to: "/console/menu",
								search: { storeId: store.id },
							})
						}
					>
						{store.name}
					</Button>
				))}
			</div>
		</div>
	);
}

function CategoriesTab({
	storeId,
	categories,
	onEdit,
	onDelete,
	onAdd,
}: {
	storeId: number;
	categories: Array<Category & { items: Item[] }>;
	onEdit: (category: Category) => void;
	onDelete: (categoryId: number) => void;
	onAdd: () => void;
}) {
	const { t } = useTranslation("menu");
	const toggleActiveMutation = useToggleCategoryActive(storeId);

	if (categories.length === 0) {
		return (
			<EmptyState
				icon={Layers}
				title={t("emptyStates.noCategories")}
				description={t("emptyStates.noCategoriesDescription")}
				action={{ label: t("titles.addCategory"), onClick: onAdd }}
			/>
		);
	}

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{categories.map((category) => (
				<CategoryCard
					key={category.id}
					category={category}
					storeId={storeId}
					onToggleActive={(categoryId, isActive) =>
						toggleActiveMutation.mutate({ categoryId, isActive })
					}
					onEdit={onEdit}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}

function ItemsTab({
	storeId,
	items,
	onDelete,
}: {
	storeId: number;
	items: Item[];
	onDelete: (itemId: number) => void;
}) {
	const { t } = useTranslation("menu");
	const toggleAvailableMutation = useToggleItemAvailableByStore(storeId);

	if (items.length === 0) {
		return (
			<EmptyState
				icon={UtensilsCrossed}
				title={t("emptyStates.noItems")}
				description={t("emptyStates.noItemsDescription")}
				action={{
					label: t("titles.addItem"),
					href: `/console/menu/items/new?storeId=${storeId}`,
				}}
			/>
		);
	}

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{items.map((item) => (
				<ItemCard
					key={item.id}
					item={item}
					onToggleAvailable={(itemId, isAvailable) =>
						toggleAvailableMutation.mutate({ itemId, isAvailable })
					}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}

function OptionsTab({
	storeId,
	optionGroups,
	onEdit,
	onDelete,
	onAdd,
}: {
	storeId: number;
	optionGroups: Array<OptionGroup & { optionChoices: OptionChoice[] }>;
	onEdit: (
		optionGroup: OptionGroup & { optionChoices: OptionChoice[] },
	) => void;
	onDelete: (optionGroupId: number) => void;
	onAdd: () => void;
}) {
	const { t } = useTranslation("menu");
	const toggleActiveMutation = useToggleOptionGroupActive(storeId);

	if (optionGroups.length === 0) {
		return (
			<EmptyState
				icon={ListChecks}
				title={t("emptyStates.noOptionGroups")}
				description={t("emptyStates.noOptionGroupsDescription")}
				action={{ label: t("titles.addOptionGroup"), onClick: onAdd }}
			/>
		);
	}

	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{optionGroups.map((optionGroup) => (
				<OptionGroupCard
					key={optionGroup.id}
					optionGroup={optionGroup}
					onToggleActive={(optionGroupId, isActive) =>
						toggleActiveMutation.mutate({ optionGroupId, isActive })
					}
					onEdit={onEdit}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}

function CategoryDialogWrapper({
	storeId,
	open,
	onOpenChange,
	category,
}: {
	storeId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	category: Category | null;
}) {
	const createMutation = useCreateCategory(storeId);
	const updateMutation = useUpdateCategory(storeId);

	const handleSave = async (data: { name: string; description?: string }) => {
		if (category) {
			await updateMutation.mutateAsync({
				categoryId: category.id,
				...data,
			});
		} else {
			await createMutation.mutateAsync(data);
		}
	};

	return (
		<CategoryDialog
			open={open}
			onOpenChange={onOpenChange}
			category={category}
			onSave={handleSave}
		/>
	);
}

function DeleteCategoryDialog({
	storeId,
	categoryId,
	onOpenChange,
}: {
	storeId: number;
	categoryId: number | null;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const deleteMutation = useDeleteCategory(storeId);

	return (
		<AlertDialog open={categoryId !== null} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("titles.deleteCategory")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("dialogs.deleteCategoryDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{tCommon("buttons.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							if (categoryId) {
								deleteMutation.mutate(categoryId, {
									onSuccess: () => onOpenChange(false),
								});
							}
						}}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{tCommon("buttons.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function OptionGroupDialogWrapper({
	storeId,
	open,
	onOpenChange,
	optionGroup,
}: {
	storeId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	optionGroup: (OptionGroup & { optionChoices: OptionChoice[] }) | null;
}) {
	const createMutation = useCreateOptionGroup(storeId);
	const updateMutation = useUpdateOptionGroup(storeId);

	const handleSave = async (data: {
		name: string;
		description?: string;
		isRequired: boolean;
		minSelections: number;
		maxSelections: number | null;
		choices: Array<{ id?: number; name: string; priceModifier: number }>;
	}) => {
		if (optionGroup) {
			await updateMutation.mutateAsync({
				optionGroupId: optionGroup.id,
				...data,
			});
		} else {
			await createMutation.mutateAsync(data);
		}
	};

	return (
		<OptionGroupDialog
			open={open}
			onOpenChange={onOpenChange}
			optionGroup={optionGroup}
			onSave={handleSave}
		/>
	);
}

function DeleteOptionGroupDialog({
	storeId,
	optionGroupId,
	onOpenChange,
}: {
	storeId: number;
	optionGroupId: number | null;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const deleteMutation = useDeleteOptionGroup(storeId);

	return (
		<AlertDialog open={optionGroupId !== null} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("titles.deleteOptionGroup")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("dialogs.deleteOptionGroupDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{tCommon("buttons.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							if (optionGroupId) {
								deleteMutation.mutate(optionGroupId, {
									onSuccess: () => onOpenChange(false),
								});
							}
						}}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{tCommon("buttons.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function DeleteItemDialog({
	storeId,
	itemId,
	onOpenChange,
}: {
	storeId: number;
	itemId: number | null;
	onOpenChange: (open: boolean) => void;
}) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const deleteMutation = useDeleteItemByStore(storeId);

	return (
		<AlertDialog open={itemId !== null} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("titles.deleteItem")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("dialogs.deleteItemDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{tCommon("buttons.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							if (itemId) {
								deleteMutation.mutate(itemId, {
									onSuccess: () => onOpenChange(false),
								});
							}
						}}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{tCommon("buttons.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
