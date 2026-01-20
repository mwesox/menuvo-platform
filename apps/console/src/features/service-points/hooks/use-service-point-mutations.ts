import type { AppRouter } from "@menuvo/api/trpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterInputs } from "@trpc/server";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

type RouterInput = inferRouterInputs<AppRouter>;
type ToggleZoneInput =
	RouterInput["store"]["servicePoints"]["toggleZoneActive"];

interface UseServicePointMutationsOptions {
	storeId: string;
}

export function useServicePointMutations({
	storeId,
}: UseServicePointMutationsOptions) {
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	const toggleMutation = useMutation({
		mutationKey: trpc.store.servicePoints.toggleActive.mutationKey(),
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
			trpcClient.store.servicePoints.toggleActive.mutate({ id, isActive }),
		onSuccess: async (servicePoint) => {
			await queryClient.invalidateQueries({
				queryKey: trpc.store.servicePoints.list.queryKey({ storeId }),
			});
			toast.success(
				servicePoint.isActive
					? tToasts("success.servicePointActivated")
					: tToasts("success.servicePointDeactivated"),
			);
		},
		onError: () => {
			toast.error(tToasts("error.updateServicePointStatus"));
		},
	});

	const toggleZoneMutation = useMutation({
		mutationKey: trpc.store.servicePoints.toggleZoneActive.mutationKey(),
		mutationFn: (input: Omit<ToggleZoneInput, "storeId">) =>
			trpcClient.store.servicePoints.toggleZoneActive.mutate({
				...input,
				storeId,
			}),
		onSuccess: async (result) => {
			await queryClient.invalidateQueries({
				queryKey: trpc.store.servicePoints.list.queryKey({ storeId }),
			});
			toast.success(
				result.isActive
					? tToasts("success.zoneActivated", { count: result.count })
					: tToasts("success.zoneDeactivated", { count: result.count }),
			);
		},
		onError: () => {
			toast.error(tToasts("error.toggleZone"));
		},
	});

	const deleteMutation = useMutation({
		mutationKey: trpc.store.servicePoints.delete.mutationKey(),
		mutationFn: (input: { id: string }) =>
			trpcClient.store.servicePoints.delete.mutate(input),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: trpc.store.servicePoints.list.queryKey({ storeId }),
			});
			toast.success(tToasts("success.servicePointDeleted"));
		},
		onError: () => {
			toast.error(tToasts("error.deleteServicePoint"));
		},
	});

	return {
		toggleActive: (id: string, isActive: boolean) =>
			toggleMutation.mutate({ id, isActive }),
		toggleZone: (zone: string, isActive: boolean) =>
			toggleZoneMutation.mutate({ zone, isActive }),
		deleteServicePoint: (id: string) => deleteMutation.mutate({ id }),
		isToggling: toggleMutation.isPending,
		isTogglingZone: toggleZoneMutation.isPending,
		isDeleting: deleteMutation.isPending,
	};
}
