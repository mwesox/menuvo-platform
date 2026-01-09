/**
 * Menu (categories & items) queries and mutations using tRPC
 *
 * Uses the tRPC v11 pattern with queryOptions() and mutationOptions().
 */

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpc, trpcClient, useTRPC, useTRPCClient } from "@/lib/trpc";
import type {
	CreateCategoryInput,
	CreateItemInput,
	UpdateCategoryInput,
	UpdateItemInput,
} from "./schemas";

/**
 * Category query options factories
 */
export const categoryQueries = {
	byStore: (storeId: string) =>
		queryOptions({
			queryKey: [...trpc.category.list.queryKey({ storeId }), "withItems"],
			queryFn: async () => {
				const [categories, items] = await Promise.all([
					trpcClient.category.list.query({ storeId }),
					trpcClient.item.listByStore.query({ storeId }),
				]);

				// Combine categories with their items
				return categories.map((category: any) => ({
					...category,
					items: items
						.filter((item: any) => item.categoryId === category.id)
						.map((item: any) => ({
							id: item.id,
							isAvailable: item.isAvailable,
							imageUrl: item.imageUrl,
						})),
				}));
			},
			enabled: !!storeId,
		}),
	detail: (categoryId: string) =>
		trpc.category.getById.queryOptions({ id: categoryId }),
};

/**
 * Item query options factories
 */
export const itemQueries = {
	byStore: (storeId: string) => trpc.item.listByStore.queryOptions({ storeId }),
	detail: (itemId: string) => trpc.item.getById.queryOptions({ id: itemId }),
};

// ============================================================================
// CATEGORY MUTATIONS
// ============================================================================

export function useCreateCategory(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.category.create.mutationKey(),
		mutationFn: async (input: CreateCategoryInput) => {
			return trpcClient.category.create.mutate({
				storeId,
				translations: input.translations,
				displayOrder: input.displayOrder,
			});
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: trpc.category.list.queryKey({ storeId }),
			});
			toast.success(t("success.categoryCreated"));
		},
		onError: () => {
			toast.error(t("error.createCategory"));
		},
	});
}

export function useUpdateCategory(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.category.update.mutationKey(),
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
				queryKey: trpc.category.list.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.category.getById.queryKey({ id: variables.categoryId }),
			});
			toast.success(t("success.categoryUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateCategory"));
		},
	});
}

export function useToggleCategoryActive(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.category.toggleActive.mutationKey(),
		mutationFn: async ({
			categoryId,
			isActive,
		}: {
			categoryId: string;
			isActive: boolean;
		}) => {
			return trpcClient.category.toggleActive.mutate({
				id: categoryId,
				isActive,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.category.list.queryKey({ storeId }),
			});
			toast.success(t("success.categoryStatusUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateCategoryStatus"));
		},
	});
}

export function useDeleteCategory(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.category.delete.mutationKey(),
		mutationFn: async (categoryId: string) => {
			return trpcClient.category.delete.mutate({ id: categoryId });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.category.list.queryKey({ storeId }),
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
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.item.create.mutationKey(),
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
				queryKey: trpc.item.listByStore.queryKey({ storeId }),
			});
			toast.success(t("success.itemCreated"));
		},
		onError: () => {
			toast.error(t("error.createItem"));
		},
	});
}

export function useUpdateItem(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.item.update.mutationKey(),
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
				queryKey: trpc.item.listByStore.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.item.getById.queryKey({ id: variables.itemId }),
			});
			toast.success(t("success.itemUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateItem"));
		},
	});
}

export function useToggleItemAvailable(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.item.toggleAvailability.mutationKey(),
		mutationFn: async ({
			itemId,
			isAvailable,
		}: {
			itemId: string;
			isAvailable: boolean;
		}) => {
			return trpcClient.item.toggleAvailability.mutate({
				id: itemId,
				isAvailable,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.item.listByStore.queryKey({ storeId }),
			});
			toast.success(t("success.itemAvailabilityUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateItemAvailability"));
		},
	});
}

export function useDeleteItem(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.item.delete.mutationKey(),
		mutationFn: async (itemId: string) => {
			return trpcClient.item.delete.mutate({ id: itemId });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.item.listByStore.queryKey({ storeId }),
			});
			toast.success(t("success.itemDeleted"));
		},
		onError: () => {
			toast.error(t("error.deleteItem"));
		},
	});
}
