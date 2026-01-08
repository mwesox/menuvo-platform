/**
 * Store queries and mutations using tRPC
 *
 * Migrated from TanStack Start server functions to tRPC client calls.
 * Uses the tRPC v11 pattern with queryOptions() and mutationOptions().
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc";
import type { CreateStoreInput, UpdateStoreInput } from "./schemas.ts";

// Query keys - kept for compatibility but tRPC generates these internally
export const storeKeys = {
	all: ["stores"] as const,
	cities: ["stores", "cities"] as const,
	detail: (storeId: string) => ["stores", storeId] as const,
	hours: (storeId: string) => ["stores", storeId, "hours"] as const,
	closures: (storeId: string) => ["stores", storeId, "closures"] as const,
};

/**
 * Store query options factories
 * Hook-based pattern for use in components
 */
export function useStoreQueries() {
	const trpc = useTRPC();

	return {
		list: () => trpc.store.list.queryOptions(),
		cities: () => trpc.store.getCities.queryOptions(),
		detail: (storeId: string) => trpc.store.getById.queryOptions({ storeId }),
	};
}

/**
 * Store mutation hooks
 */
export function useCreateStore() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		...trpc.store.create.mutationOptions(),
		mutationFn: async (input: CreateStoreInput) => {
			// TODO: Map CreateStoreInput to tRPC input schema
			// This is a placeholder - actual implementation needs schema alignment
			return trpc.store.create.mutate({
				name: input.name,
				slug: input.slug,
				description: input.description,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.list.queryKey(),
			});
			toast.success(t("success.storeCreated"));
		},
		onError: () => {
			toast.error(t("error.createStore"));
		},
	});
}

export function useUpdateStore() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: async (input: UpdateStoreInput & { storeId: string }) => {
			// TODO: Align UpdateStoreInput with tRPC schema
			return trpc.store.update.mutate({
				id: input.storeId,
				name: input.name,
				description: input.description,
			});
		},
		onSuccess: (updatedStore) => {
			queryClient.setQueryData(
				trpc.store.getById.queryKey({ id: updatedStore.id }),
				updatedStore,
			);
			queryClient.invalidateQueries({
				queryKey: trpc.store.list.queryKey(),
			});
			toast.success(t("success.storeUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateStore"));
		},
	});
}

export function useToggleStoreActive() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		...trpc.store.toggleActive.mutationOptions(),
		onSuccess: (store) => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.list.queryKey(),
			});
			toast.success(
				store.isActive
					? t("success.storeActivated")
					: t("success.storeDeactivated"),
			);
		},
		onError: () => {
			toast.error(t("error.updateStoreStatus"));
		},
	});
}

export function useDeleteStore() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		...trpc.store.delete.mutationOptions(),
		mutationFn: async (storeId: string) => {
			return trpc.store.delete.mutate({ id: storeId });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.list.queryKey(),
			});
			toast.success(t("success.storeDeleted"));
		},
		onError: () => {
			toast.error(t("error.deleteStore"));
		},
	});
}

// ============================================================================
// STORE HOURS
// ============================================================================

export function useStoreHoursQueries() {
	const trpc = useTRPC();

	return {
		list: (storeId: string) => trpc.hours.get.queryOptions({ storeId }),
	};
}

export function useSaveStoreHours() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		...trpc.hours.save.mutationOptions(),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: trpc.hours.get.queryKey({ storeId: variables.storeId }),
			});
			toast.success(t("success.hoursUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateHours"));
		},
	});
}

// ============================================================================
// STORE CLOSURES
// ============================================================================

export function useStoreClosuresQueries() {
	const trpc = useTRPC();

	return {
		list: (storeId: string) => trpc.closures.list.queryOptions({ storeId }),
	};
}

export function useCreateStoreClosure() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		...trpc.closures.create.mutationOptions(),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: trpc.closures.list.queryKey({ storeId: variables.storeId }),
			});
			toast.success(t("success.closureCreated"));
		},
		onError: () => {
			toast.error(t("error.createClosure"));
		},
	});
}

export function useUpdateStoreClosure(storeId: string) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		...trpc.closures.update.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.closures.list.queryKey({ storeId }),
			});
			toast.success(t("success.closureUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateClosure"));
		},
	});
}

export function useDeleteStoreClosure(storeId: string) {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		...trpc.closures.delete.mutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.closures.list.queryKey({ storeId }),
			});
			toast.success(t("success.closureDeleted"));
		},
		onError: () => {
			toast.error(t("error.deleteClosure"));
		},
	});
}
