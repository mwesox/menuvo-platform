import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpcClient } from "@/lib/trpc";
import { minutes } from "@/lib/utils";
import type {
	BatchCreateInput,
	CreateServicePointInput,
	ToggleZoneInput,
	UpdateServicePointInput,
} from "./schemas.ts";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const servicePointKeys = {
	all: ["servicePoints"] as const,
	list: (storeId: string) => ["servicePoints", "list", storeId] as const,
	detail: (id: string) => ["servicePoints", "detail", id] as const,
	zones: (storeId: string) => ["servicePoints", "zones", storeId] as const,
};

// ============================================================================
// QUERY OPTIONS FACTORIES
// ============================================================================

export const servicePointQueries = {
	list: (storeId: string) =>
		queryOptions({
			queryKey: servicePointKeys.list(storeId),
			queryFn: () => trpcClient.servicePoint.list.query({ storeId }),
			staleTime: minutes(5),
		}),

	detail: (id: string) =>
		queryOptions({
			queryKey: servicePointKeys.detail(id),
			queryFn: () => trpcClient.servicePoint.getById.query({ id }),
			staleTime: minutes(5),
		}),

	zones: (storeId: string) =>
		queryOptions({
			queryKey: servicePointKeys.zones(storeId),
			queryFn: () => trpcClient.servicePoint.getZones.query({ storeId }),
			staleTime: minutes(5),
		}),
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useCreateServicePoint(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Omit<CreateServicePointInput, "storeId">) =>
			trpcClient.servicePoint.create.mutate({ ...input, storeId }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: servicePointKeys.list(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: servicePointKeys.zones(storeId),
			});
			toast.success(t("success.servicePointCreated"));
		},
		onError: () => {
			toast.error(t("error.createServicePoint"));
		},
	});
}

export function useUpdateServicePoint(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateServicePointInput & { id: string }) =>
			trpcClient.servicePoint.update.mutate(input),
		onSuccess: (updated) => {
			queryClient.setQueryData(servicePointKeys.detail(updated.id), updated);
			queryClient.invalidateQueries({
				queryKey: servicePointKeys.list(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: servicePointKeys.zones(storeId),
			});
			toast.success(t("success.servicePointUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateServicePoint"));
		},
	});
}

export function useToggleServicePointActive(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
			trpcClient.servicePoint.toggleActive.mutate({ id, isActive }),
		onSuccess: (servicePoint) => {
			queryClient.invalidateQueries({
				queryKey: servicePointKeys.list(storeId),
			});
			toast.success(
				servicePoint.isActive
					? t("success.servicePointActivated")
					: t("success.servicePointDeactivated"),
			);
		},
		onError: () => {
			toast.error(t("error.updateServicePointStatus"));
		},
	});
}

export function useDeleteServicePoint(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (id: string) => trpcClient.servicePoint.delete.mutate({ id }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: servicePointKeys.list(storeId),
			});
			toast.success(t("success.servicePointDeleted"));
		},
		onError: () => {
			toast.error(t("error.deleteServicePoint"));
		},
	});
}

export function useBatchCreateServicePoints(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Omit<BatchCreateInput, "storeId">) =>
			trpcClient.servicePoint.batchCreate.mutate({ ...input, storeId }),
		onSuccess: (created) => {
			queryClient.invalidateQueries({
				queryKey: servicePointKeys.list(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: servicePointKeys.zones(storeId),
			});
			toast.success(
				t("success.servicePointsBatchCreated", { count: created.length }),
			);
		},
		onError: () => {
			toast.error(t("error.batchCreateServicePoints"));
		},
	});
}

export function useToggleZoneActive(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Omit<ToggleZoneInput, "storeId">) =>
			trpcClient.servicePoint.toggleZoneActive.mutate({ ...input, storeId }),
		onSuccess: (result) => {
			queryClient.invalidateQueries({
				queryKey: servicePointKeys.list(storeId),
			});
			toast.success(
				result.isActive
					? t("success.zoneActivated", { count: result.count })
					: t("success.zoneDeactivated", { count: result.count }),
			);
		},
		onError: () => {
			toast.error(t("error.toggleZone"));
		},
	});
}
