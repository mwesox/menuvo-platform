/**
 * Menu (categories & items) queries and mutations using tRPC
 *
 * Migrated from TanStack Start server functions to tRPC client calls.
 * Uses the tRPC v11 pattern with queryOptions() and mutationOptions().
 */

import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpcClient } from "@/lib/trpc";
import type {
	CreateCategoryInput,
	CreateItemInput,
	UpdateCategoryInput,
	UpdateItemInput,
} from "./schemas";

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

/**
 * Category query options factories
 */
export const categoryQueries = {
	byStore: (storeId: string) =>
		queryOptions({
			queryKey: menuKeys.categories.byStore(storeId),
			queryFn: async () => {
				return trpcClient.category.list.query({ storeId });
			},
			enabled: !!storeId,
		}),
	detail: (categoryId: string) =>
		queryOptions({
			queryKey: menuKeys.categories.detail(categoryId),
			queryFn: async () => {
				return trpcClient.category.getById.query({ id: categoryId });
			},
		}),
};

/**
 * Item query options factories
 */
export const itemQueries = {
	byStore: (storeId: string) =>
		queryOptions({
			queryKey: menuKeys.items.byStore(storeId),
			queryFn: async () => {
				return trpcClient.item.list.query({ storeId });
			},
			enabled: !!storeId,
		}),
	detail: (itemId: string) =>
		queryOptions({
			queryKey: menuKeys.items.detail(itemId),
			queryFn: async () => {
				return trpcClient.item.getById.query({ id: itemId });
			},
		}),
};

// ============================================================================
// CATEGORY MUTATIONS
// ============================================================================

export function useCreateCategory(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: async (input: CreateCategoryInput) => {
			return trpcClient.category.create.mutate({
				storeId,
				translations: input.translations,
				displayOrder: input.displayOrder,
			});
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
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
		mutationFn: async (input: UpdateCategoryInput & { categoryId: string }) => {
			return trpcClient.category.update.mutate({
				id: input.categoryId,
				translations: input.translations,
				displayOrder: input.displayOrder,
				isActive: input.isActive,
			});
		},
		onSuccess: async (_, variables) => {
			await queryClient.invalidateQueries({
				queryKey: menuKeys.categories.byStore(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: menuKeys.categories.detail(variables.categoryId),
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
		mutationFn: async ({
			categoryId,
			isActive,
		}: {
			categoryId: string;
			isActive: boolean;
		}) => {
			return trpcClient.category.update.mutate({
				id: categoryId,
				isActive,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.categories.byStore(storeId),
			});
			toast.success(t("success.categoryStatusUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateCategoryStatus"));
		},
	});
}

export function useDeleteCategory(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: async (categoryId: string) => {
			return trpcClient.category.delete.mutate({ id: categoryId });
		},
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

// ============================================================================
// ITEM MUTATIONS
// ============================================================================

export function useCreateItem(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: async (input: CreateItemInput) => {
			return trpcClient.item.create.mutate({
				categoryId: input.categoryId,
				translations: input.translations,
				price: input.price,
				imageUrl: input.imageUrl,
				allergens: input.allergens,
				displayOrder: input.displayOrder,
				kitchenName: input.kitchenName,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.items.byStore(storeId),
			});
			toast.success(t("success.itemCreated"));
		},
		onError: () => {
			toast.error(t("error.createItem"));
		},
	});
}

export function useUpdateItem(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: async (input: UpdateItemInput & { itemId: string }) => {
			return trpcClient.item.update.mutate({
				id: input.itemId,
				categoryId: input.categoryId,
				translations: input.translations,
				price: input.price,
				imageUrl: input.imageUrl,
				allergens: input.allergens,
				displayOrder: input.displayOrder,
				isAvailable: input.isAvailable,
				kitchenName: input.kitchenName,
			});
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.items.byStore(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: menuKeys.items.detail(variables.itemId),
			});
			toast.success(t("success.itemUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateItem"));
		},
	});
}

export function useToggleItemAvailable(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: async ({
			itemId,
			isAvailable,
		}: {
			itemId: string;
			isAvailable: boolean;
		}) => {
			return trpcClient.item.update.mutate({
				id: itemId,
				isAvailable,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: menuKeys.items.byStore(storeId),
			});
			toast.success(t("success.itemAvailabilityUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateItemAvailability"));
		},
	});
}

export function useDeleteItem(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: async (itemId: string) => {
			return trpcClient.item.delete.mutate({ id: itemId });
		},
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
