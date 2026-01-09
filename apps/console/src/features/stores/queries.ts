/**
 * Store queries and mutations using tRPC
 *
 * Uses the tRPC v11 pattern with queryOptions() and mutationOptions().
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpc, useTRPC, useTRPCClient } from "@/lib/trpc";
import type { CreateStoreInput, UpdateStoreInput } from "./schemas.ts";

type DayOfWeek =
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday";

/**
 * Store query options factories
 * Direct object for use in loaders and non-hook contexts
 */
export const storeQueries = {
	list: () => trpc.store.list.queryOptions(),
	cities: () => trpc.store.getCities.queryOptions(),
	detail: (storeId: string) => trpc.store.getById.queryOptions({ storeId }),
	/** Combined query for store detail page - fetches store, hours, and closures in one request */
	withDetails: (storeId: string) =>
		trpc.store.getWithDetails.queryOptions({ storeId }),
};

/**
 * Store hours query options factories
 */
export const storeHoursQueries = {
	list: (storeId: string) => trpc.hours.get.queryOptions({ storeId }),
};

/**
 * Store closures query options factories
 */
export const storeClosuresQueries = {
	list: (storeId: string) => trpc.closures.list.queryOptions({ storeId }),
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
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.store.create.mutationKey(),
		mutationFn: async (input: CreateStoreInput) => {
			return trpcClient.store.create.mutate({
				name: input.name,
				street: input.street,
				city: input.city,
				postalCode: input.postalCode,
				country: input.country,
				phone: input.phone,
				email: input.email || undefined,
				timezone: input.timezone,
				currency: input.currency,
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
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.store.update.mutationKey(),
		mutationFn: async (input: UpdateStoreInput & { storeId: string }) => {
			return trpcClient.store.update.mutate({
				storeId: input.storeId,
				name: input.name,
				street: input.street,
				city: input.city,
				postalCode: input.postalCode,
				country: input.country,
				phone: input.phone,
				email: input.email || undefined,
				timezone: input.timezone,
				currency: input.currency,
			});
		},
		onSuccess: (updatedStore) => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.getById.queryKey({ storeId: updatedStore.id }),
			});
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
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.store.toggleActive.mutationKey(),
		mutationFn: async (input: { storeId: string; isActive: boolean }) => {
			return trpcClient.store.toggleActive.mutate({
				storeId: input.storeId,
				isActive: input.isActive,
			});
		},
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
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.store.delete.mutationKey(),
		mutationFn: async (storeId: string) => {
			return trpcClient.store.delete.mutate({ storeId });
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
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.hours.save.mutationKey(),
		mutationFn: async (input: {
			storeId: string;
			hours: Array<{
				dayOfWeek: DayOfWeek;
				openTime: string;
				closeTime: string;
				displayOrder?: number;
			}>;
		}) => {
			return trpcClient.hours.save.mutate({
				storeId: input.storeId,
				hours: input.hours,
			});
		},
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
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.closures.create.mutationKey(),
		mutationFn: async (input: {
			storeId: string;
			startDate: string;
			endDate: string;
			reason?: string;
		}) => {
			return trpcClient.closures.create.mutate({
				storeId: input.storeId,
				startDate: input.startDate,
				endDate: input.endDate,
				reason: input.reason,
			});
		},
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
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.closures.update.mutationKey(),
		mutationFn: async (input: {
			id: string;
			startDate: string;
			endDate: string;
			reason?: string;
		}) => {
			return trpcClient.closures.update.mutate({
				id: input.id,
				startDate: input.startDate,
				endDate: input.endDate,
				reason: input.reason,
			});
		},
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
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.closures.delete.mutationKey(),
		mutationFn: async (input: { id: string }) => {
			return trpcClient.closures.delete.mutate({
				id: input.id,
			});
		},
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
