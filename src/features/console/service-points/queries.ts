import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { minutes } from "@/lib/utils";
import {
	getServicePointScanStats,
	getStoreScanStats,
} from "./server/scans.functions.ts";
import {
	batchCreateServicePoints,
	createServicePoint,
	deleteServicePoint,
	getServicePoint,
	getServicePoints,
	getServicePointZones,
	toggleServicePointActive,
	toggleZoneActive,
	updateServicePoint,
} from "./server/service-points.functions.ts";
import type {
	BatchCreateInput,
	CreateServicePointInput,
	ToggleZoneInput,
	UpdateServicePointInput,
} from "./validation.ts";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const servicePointKeys = {
	all: ["servicePoints"] as const,
	list: (storeId: number) => ["servicePoints", "list", storeId] as const,
	detail: (id: number) => ["servicePoints", "detail", id] as const,
	zones: (storeId: number) => ["servicePoints", "zones", storeId] as const,
	scans: {
		store: (storeId: number, days = 30) =>
			["servicePoints", "scans", "store", storeId, days] as const,
		servicePoint: (id: number, days = 30) =>
			["servicePoints", "scans", "detail", id, days] as const,
	},
};

// ============================================================================
// QUERY OPTIONS FACTORIES
// ============================================================================

export const servicePointQueries = {
	list: (storeId: number) =>
		queryOptions({
			queryKey: servicePointKeys.list(storeId),
			queryFn: () => getServicePoints({ data: { storeId } }),
			staleTime: minutes(5),
		}),

	detail: (id: number) =>
		queryOptions({
			queryKey: servicePointKeys.detail(id),
			queryFn: () => getServicePoint({ data: { id } }),
			staleTime: minutes(5),
		}),

	zones: (storeId: number) =>
		queryOptions({
			queryKey: servicePointKeys.zones(storeId),
			queryFn: () => getServicePointZones({ data: { storeId } }),
			staleTime: minutes(5),
		}),

	storeScans: (storeId: number, days = 30) =>
		queryOptions({
			queryKey: servicePointKeys.scans.store(storeId, days),
			queryFn: () => getStoreScanStats({ data: { storeId, days } }),
		}),

	servicePointScans: (servicePointId: number, days = 30) =>
		queryOptions({
			queryKey: servicePointKeys.scans.servicePoint(servicePointId, days),
			queryFn: () =>
				getServicePointScanStats({ data: { servicePointId, days } }),
		}),
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useCreateServicePoint(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Omit<CreateServicePointInput, "storeId">) =>
			createServicePoint({ data: { ...input, storeId } }),
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

export function useUpdateServicePoint(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateServicePointInput & { id: number }) =>
			updateServicePoint({ data: input }),
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

export function useToggleServicePointActive(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
			toggleServicePointActive({ data: { id, isActive } }),
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

export function useDeleteServicePoint(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (id: number) => deleteServicePoint({ data: { id } }),
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

export function useBatchCreateServicePoints(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Omit<BatchCreateInput, "storeId">) =>
			batchCreateServicePoints({ data: { ...input, storeId } }),
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

export function useToggleZoneActive(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Omit<ToggleZoneInput, "storeId">) =>
			toggleZoneActive({ data: { ...input, storeId } }),
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
