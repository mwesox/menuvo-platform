import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type {
	CreateCategoryInput,
	CreateItemInput,
	UpdateCategoryInput,
	UpdateItemInput,
} from "./schemas.ts";
import {
	createCategory,
	deleteCategory,
	getCategories,
	getCategory,
	toggleCategoryActive,
	updateCategory,
} from "./server/categories.functions.ts";
import {
	createItem,
	deleteItem,
	getItem,
	getItemsByStore,
	toggleItemAvailable,
	updateItem,
} from "./server/items.functions.ts";

// Query keys
export const menuKeys = {
	categories: {
		byStore: (storeId: string) => ["categories", "store", storeId] as const,
		detail: (categoryId: string) =>
			["categories", "detail", categoryId] as const,
	},
	items: {
		byStore: (storeId: string) => ["items", "store", storeId] as const,
		detail: (itemId: string) => ["items", itemId] as const,
	},
};

// Category query options factories
export const categoryQueries = {
	byStore: (storeId: string) =>
		queryOptions({
			queryKey: menuKeys.categories.byStore(storeId),
			queryFn: () => getCategories({ data: { storeId } }),
			enabled: !!storeId,
		}),

	detail: (categoryId: string) =>
		queryOptions({
			queryKey: menuKeys.categories.detail(categoryId),
			queryFn: () => getCategory({ data: { categoryId } }),
		}),
};

// Item query options factories
export const itemQueries = {
	byStore: (storeId: string) =>
		queryOptions({
			queryKey: menuKeys.items.byStore(storeId),
			queryFn: () => getItemsByStore({ data: { storeId } }),
			enabled: !!storeId,
		}),

	detail: (itemId: string) =>
		queryOptions({
			queryKey: menuKeys.items.detail(itemId),
			queryFn: () => getItem({ data: { itemId } }),
		}),
};

// Category mutation hooks
export function useCreateCategory(storeId: string) {
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

export function useUpdateCategory(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			categoryId,
			...data
		}: UpdateCategoryInput & { categoryId: string }) =>
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

export function useToggleCategoryActive(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			categoryId,
			isActive,
		}: {
			categoryId: string;
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

export function useDeleteCategory(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (categoryId: string) =>
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
export function useCreateItem(storeId: string, categoryId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (
			input: Omit<CreateItemInput, "categoryId" | "storeId" | "displayOrder">,
		) => createItem({ data: { categoryId, storeId, ...input } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.items.byStore(storeId),
			});
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

export function useUpdateItem(storeId: string, categoryId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({ itemId, ...data }: UpdateItemInput & { itemId: string }) =>
			updateItem({ data: { itemId, ...data } }),
		onSuccess: (updatedItem) => {
			queryClient.setQueryData(
				menuKeys.items.detail(updatedItem.id),
				updatedItem,
			);
			queryClient.invalidateQueries({
				queryKey: menuKeys.items.byStore(storeId),
			});
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

export function useToggleItemAvailable(storeId: string, categoryId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			itemId,
			isAvailable,
		}: {
			itemId: string;
			isAvailable: boolean;
		}) => toggleItemAvailable({ data: { itemId, isAvailable } }),
		onSuccess: (item) => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.items.byStore(storeId),
			});
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

export function useDeleteItem(storeId: string, categoryId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (itemId: string) => deleteItem({ data: { itemId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.items.byStore(storeId),
			});
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
export function useToggleItemAvailableByStore(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			itemId,
			isAvailable,
		}: {
			itemId: string;
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

export function useDeleteItemByStore(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (itemId: string) => deleteItem({ data: { itemId } }),
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
