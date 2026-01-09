/**
 * Kitchen-specific query hooks.
 *
 * Extends base order queries with kitchen-specific behavior
 * like offline mutation queueing and silent status updates.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { OrderStatus } from "@/features/orders/constants";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { useConnectionStatus } from "./hooks/use-connection-status";
import { useMutationQueue } from "./stores/mutation-queue";

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Kitchen-specific order status update mutation.
 *
 * Differs from base useUpdateOrderStatus:
 * - Queues mutations when offline for retry
 * - No success toast (column movement provides visual feedback)
 * - Includes kitchenDone cache invalidation
 */
export function useKitchenUpdateOrderStatus(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const { t } = useTranslation("console-kitchen");
	const queryClient = useQueryClient();
	const { isOnline } = useConnectionStatus();
	const mutationQueue = useMutationQueue();

	return useMutation({
		...trpc.order.updateStatus.mutationOptions(),
		mutationFn: async ({
			orderId,
			status,
		}: {
			orderId: string;
			status: OrderStatus;
		}) => {
			return trpcClient.order.updateStatus.mutate({ orderId, status });
		},
		onSuccess: (_data, variables) => {
			// Invalidate all related queries
			queryClient.invalidateQueries({
				queryKey: trpc.order.listByStore.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.order.listForKitchen.queryKey({ storeId, limit: 50 }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.order.kitchenDone.queryKey({ storeId, limit: 20 }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.order.getById.queryKey({ orderId: variables.orderId }),
			});
			// No toast - column movement provides visual feedback
		},
		onError: (_error, variables) => {
			// Queue for retry if offline
			if (!isOnline) {
				mutationQueue.addMutation({
					type: "updateStatus",
					orderId: variables.orderId,
					payload: { status: variables.status },
				});
				toast.info(t("info.queuedForSync"));
			} else {
				toast.error(t("errors.updateFailed"));
				// Invalidate to revert to server state
				queryClient.invalidateQueries({
					queryKey: trpc.order.listForKitchen.queryKey({ storeId, limit: 50 }),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.order.kitchenDone.queryKey({ storeId, limit: 20 }),
				});
			}
		},
	});
}
