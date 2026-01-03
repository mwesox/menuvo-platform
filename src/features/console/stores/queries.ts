import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { minutes } from "@/lib/utils";
import type {
	CreateStoreClosureInput,
	UpdateStoreClosureInput,
} from "./closures-validation.ts";
import type { SaveStoreHoursInput } from "./hours-validation.ts";
import {
	createStoreClosure,
	deleteStoreClosure,
	getStoreClosures,
	updateStoreClosure,
} from "./server/closures.functions.ts";
import { getStoreHours, saveStoreHours } from "./server/hours.functions.ts";
import {
	createStore,
	deleteStore,
	getStore,
	getStoreCities,
	getStores,
	toggleStoreActive,
	updateStore,
} from "./server/stores.functions.ts";
import type { CreateStoreInput, UpdateStoreInput } from "./validation.ts";

// Query keys
export const storeKeys = {
	all: ["stores"] as const,
	cities: ["stores", "cities"] as const,
	detail: (storeId: number) => ["stores", storeId] as const,
	hours: (storeId: number) => ["stores", storeId, "hours"] as const,
	closures: (storeId: number) => ["stores", storeId, "closures"] as const,
};

// Query options factories
export const storeQueries = {
	list: () =>
		queryOptions({
			queryKey: storeKeys.all,
			queryFn: () => getStores(),
		}),

	cities: () =>
		queryOptions({
			queryKey: storeKeys.cities,
			queryFn: () => getStoreCities(),
		}),

	detail: (storeId: number) =>
		queryOptions({
			queryKey: storeKeys.detail(storeId),
			queryFn: () => getStore({ data: { storeId } }),
			staleTime: minutes(5),
		}),
};

// Mutation hooks
export function useCreateStore() {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: CreateStoreInput) => createStore({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: storeKeys.all });
			toast.success(t("success.storeCreated"));
		},
		onError: () => {
			toast.error(t("error.createStore"));
		},
	});
}

export function useUpdateStore() {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateStoreInput & { storeId: number }) =>
			updateStore({ data: input }),
		onSuccess: (updatedStore) => {
			queryClient.setQueryData(storeKeys.detail(updatedStore.id), updatedStore);
			queryClient.invalidateQueries({ queryKey: storeKeys.all });
			toast.success(t("success.storeUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateStore"));
		},
	});
}

export function useToggleStoreActive() {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			storeId,
			isActive,
		}: {
			storeId: number;
			isActive: boolean;
		}) => toggleStoreActive({ data: { storeId, isActive } }),
		onSuccess: (store) => {
			queryClient.invalidateQueries({ queryKey: storeKeys.all });
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
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (storeId: number) => deleteStore({ data: { storeId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: storeKeys.all });
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

export const storeHoursQueries = {
	list: (storeId: number) =>
		queryOptions({
			queryKey: storeKeys.hours(storeId),
			queryFn: () => getStoreHours({ data: { storeId } }),
			staleTime: minutes(5),
		}),
};

export function useSaveStoreHours() {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: SaveStoreHoursInput) => saveStoreHours({ data: input }),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: storeKeys.hours(variables.storeId),
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

export const storeClosuresQueries = {
	list: (storeId: number) =>
		queryOptions({
			queryKey: storeKeys.closures(storeId),
			queryFn: () => getStoreClosures({ data: { storeId } }),
			staleTime: minutes(5),
		}),
};

export function useCreateStoreClosure() {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: CreateStoreClosureInput) =>
			createStoreClosure({ data: input }),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: storeKeys.closures(variables.storeId),
			});
			toast.success(t("success.closureCreated"));
		},
		onError: () => {
			toast.error(t("error.createClosure"));
		},
	});
}

export function useUpdateStoreClosure(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateStoreClosureInput) =>
			updateStoreClosure({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: storeKeys.closures(storeId),
			});
			toast.success(t("success.closureUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateClosure"));
		},
	});
}

export function useDeleteStoreClosure(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (id: number) => deleteStoreClosure({ data: { id } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: storeKeys.closures(storeId),
			});
			toast.success(t("success.closureDeleted"));
		},
		onError: () => {
			toast.error(t("error.deleteClosure"));
		},
	});
}
