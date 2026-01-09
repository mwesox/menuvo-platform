import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpc, useTRPC, useTRPCClient } from "@/lib/trpc";
import type {
	BatchCreateInput,
	CreateServicePointInput,
	ToggleZoneInput,
	UpdateServicePointInput,
} from "./schemas.ts";

// ============================================================================
// QUERY OPTIONS FACTORIES
// ============================================================================

export const servicePointQueries = {
	list: (storeId: string) => trpc.servicePoint.list.queryOptions({ storeId }),
	detail: (id: string) => trpc.servicePoint.getById.queryOptions({ id }),
	zones: (storeId: string) =>
		trpc.servicePoint.getZones.queryOptions({ storeId }),
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export function useCreateServicePoint(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.servicePoint.create.mutationKey(),
		mutationFn: (input: Omit<CreateServicePointInput, "storeId">) =>
			trpcClient.servicePoint.create.mutate({ ...input, storeId }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.servicePoint.list.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.servicePoint.getZones.queryKey({ storeId }),
			});
			toast.success(t("success.servicePointCreated"));
		},
		onError: () => {
			toast.error(t("error.createServicePoint"));
		},
	});
}

export function useUpdateServicePoint(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.servicePoint.update.mutationKey(),
		mutationFn: (input: UpdateServicePointInput & { id: string }) =>
			trpcClient.servicePoint.update.mutate(input),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({
				queryKey: trpc.servicePoint.getById.queryKey({ id: updated.id }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.servicePoint.list.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.servicePoint.getZones.queryKey({ storeId }),
			});
			toast.success(t("success.servicePointUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateServicePoint"));
		},
	});
}

export function useToggleServicePointActive(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.servicePoint.toggleActive.mutationKey(),
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
			trpcClient.servicePoint.toggleActive.mutate({ id, isActive }),
		onSuccess: (servicePoint) => {
			queryClient.invalidateQueries({
				queryKey: trpc.servicePoint.list.queryKey({ storeId }),
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
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.servicePoint.delete.mutationKey(),
		mutationFn: (id: string) => trpcClient.servicePoint.delete.mutate({ id }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.servicePoint.list.queryKey({ storeId }),
			});
			toast.success(t("success.servicePointDeleted"));
		},
		onError: () => {
			toast.error(t("error.deleteServicePoint"));
		},
	});
}

export function useBatchCreateServicePoints(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.servicePoint.batchCreate.mutationKey(),
		mutationFn: (input: Omit<BatchCreateInput, "storeId">) => {
			// Transform form input (endNumber) to API input (count)
			const count = input.endNumber - input.startNumber + 1;
			return trpcClient.servicePoint.batchCreate.mutate({
				storeId,
				prefix: input.prefix,
				startNumber: input.startNumber,
				count,
				type: input.type ?? "table",
				zone: input.zone,
			});
		},
		onSuccess: (created) => {
			queryClient.invalidateQueries({
				queryKey: trpc.servicePoint.list.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.servicePoint.getZones.queryKey({ storeId }),
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
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.servicePoint.toggleZoneActive.mutationKey(),
		mutationFn: (input: Omit<ToggleZoneInput, "storeId">) =>
			trpcClient.servicePoint.toggleZoneActive.mutate({ ...input, storeId }),
		onSuccess: (result) => {
			queryClient.invalidateQueries({
				queryKey: trpc.servicePoint.list.queryKey({ storeId }),
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
