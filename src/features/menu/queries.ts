import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
	createCategory,
	deleteCategory,
	getCategories,
	getCategory,
	toggleCategoryActive,
	updateCategory,
} from "./server/categories.functions";
import {
	createItem,
	deleteItem,
	getItem,
	getItemsByStore,
	toggleItemAvailable,
	updateItem,
} from "./server/items.functions";
import type {
	CreateCategoryInput,
	CreateItemInput,
	UpdateCategoryInput,
	UpdateItemInput,
} from "./validation";

// Query keys
export const menuKeys = {
	categories: {
		byStore: (storeId: number) => ["categories", "store", storeId] as const,
		detail: (categoryId: number) =>
			["categories", "detail", categoryId] as const,
	},
	items: {
		byStore: (storeId: number) => ["items", "store", storeId] as const,
		detail: (itemId: number) => ["items", itemId] as const,
	},
};

// Category query options factories
export const categoryQueries = {
	byStore: (storeId: number) =>
		queryOptions({
			queryKey: menuKeys.categories.byStore(storeId),
			queryFn: () => getCategories({ data: { storeId } }),
			enabled: !!storeId,
		}),

	detail: (categoryId: number) =>
		queryOptions({
			queryKey: menuKeys.categories.detail(categoryId),
			queryFn: () => getCategory({ data: { categoryId } }),
		}),
};

// Item query options factories
export const itemQueries = {
	byStore: (storeId: number) =>
		queryOptions({
			queryKey: menuKeys.items.byStore(storeId),
			queryFn: () => getItemsByStore({ data: { storeId } }),
			enabled: !!storeId,
		}),

	detail: (itemId: number) =>
		queryOptions({
			queryKey: menuKeys.items.detail(itemId),
			queryFn: () => getItem({ data: { itemId } }),
		}),
};

// Category mutation hooks
export function useCreateCategory(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Omit<CreateCategoryInput, "storeId">) =>
			createCategory({ data: { storeId, ...input } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.categories.byStore(storeId),
			});
			toast.success(t("success.categoryCreated"));
		},
		onError: () => {
			toast.error(t("error.createCategory"));
		},
	});
}

export function useUpdateCategory(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			categoryId,
			...data
		}: UpdateCategoryInput & { categoryId: number }) =>
			updateCategory({ data: { categoryId, ...data } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.categories.byStore(storeId),
			});
			toast.success(t("success.categoryUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateCategory"));
		},
	});
}

export function useToggleCategoryActive(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			categoryId,
			isActive,
		}: {
			categoryId: number;
			isActive: boolean;
		}) => toggleCategoryActive({ data: { categoryId, isActive } }),
		onSuccess: (category) => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.categories.byStore(storeId),
			});
			toast.success(
				category.isActive
					? t("success.categoryShown")
					: t("success.categoryHidden"),
			);
		},
		onError: () => {
			toast.error(t("error.updateCategory"));
		},
	});
}

export function useDeleteCategory(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (categoryId: number) =>
			deleteCategory({ data: { categoryId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.categories.byStore(storeId),
			});
			toast.success(t("success.categoryDeleted"));
		},
		onError: () => {
			toast.error(t("error.deleteCategory"));
		},
	});
}

// Item mutation hooks
export function useCreateItem(categoryId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Omit<CreateItemInput, "categoryId">) =>
			createItem({ data: { categoryId, ...input } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.categories.detail(categoryId),
			});
			toast.success(t("success.itemCreated"));
		},
		onError: () => {
			toast.error(t("error.createItem"));
		},
	});
}

export function useUpdateItem(categoryId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({ itemId, ...data }: UpdateItemInput & { itemId: number }) =>
			updateItem({ data: { itemId, ...data } }),
		onSuccess: (updatedItem) => {
			queryClient.setQueryData(
				menuKeys.items.detail(updatedItem.id),
				updatedItem,
			);
			queryClient.invalidateQueries({
				queryKey: menuKeys.categories.detail(categoryId),
			});
			toast.success(t("success.itemUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateItem"));
		},
	});
}

export function useToggleItemAvailable(categoryId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			itemId,
			isAvailable,
		}: {
			itemId: number;
			isAvailable: boolean;
		}) => toggleItemAvailable({ data: { itemId, isAvailable } }),
		onSuccess: (item) => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.categories.detail(categoryId),
			});
			toast.success(
				item.isAvailable
					? t("success.itemAvailable")
					: t("success.itemUnavailable"),
			);
		},
		onError: () => {
			toast.error(t("error.updateItem"));
		},
	});
}

export function useDeleteItem(categoryId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (itemId: number) => deleteItem({ data: { itemId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.categories.detail(categoryId),
			});
			toast.success(t("success.itemDeleted"));
		},
		onError: () => {
			toast.error(t("error.deleteItem"));
		},
	});
}

// Item mutation hooks (store-level)
export function useToggleItemAvailableByStore(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			itemId,
			isAvailable,
		}: {
			itemId: number;
			isAvailable: boolean;
		}) => toggleItemAvailable({ data: { itemId, isAvailable } }),
		onSuccess: (item) => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.items.byStore(storeId),
			});
			toast.success(
				item.isAvailable
					? t("success.itemAvailable")
					: t("success.itemUnavailable"),
			);
		},
		onError: () => {
			toast.error(t("error.updateItem"));
		},
	});
}

export function useDeleteItemByStore(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (itemId: number) => deleteItem({ data: { itemId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.items.byStore(storeId),
			});
			toast.success(t("success.itemDeleted"));
		},
		onError: () => {
			toast.error(t("error.deleteItem"));
		},
	});
}
