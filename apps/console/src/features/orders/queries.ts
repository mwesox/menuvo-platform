/**
 * Console order queries and mutations using tRPC
 *
 * Uses the tRPC v11 pattern with queryOptions() and mutationOptions().
 */

import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpc, trpcClient, useTRPC, useTRPCClient } from "@/lib/trpc";
import type { OrderStatus } from "./types";

// Query options for orders
export const orderQueries = {
	byStore: (
		storeId: string,
		options?: {
			status?: OrderStatus;
			search?: string;
			fromDate?: string;
			limit?: number;
			cursor?: string;
		},
	) =>
		queryOptions({
			queryKey: [
				...trpc.order.listByStore.queryKey({ storeId }),
				options?.status,
				options?.search,
				options?.fromDate,
				options?.limit,
				options?.cursor,
			],
			queryFn: async () => {
				return trpcClient.order.listByStore.query({
					storeId,
					status: options?.status,
					startDate: options?.fromDate ? new Date(options.fromDate) : undefined,
					limit: options?.limit ?? 50,
					cursor: options?.cursor,
				});
			},
		}),
	detail: (orderId: string) => trpc.order.getById.queryOptions({ orderId }),
	kitchen: (storeId: string) =>
		trpc.order.listForKitchen.queryOptions({ storeId, limit: 50 }),
	kitchenDone: (storeId: string) =>
		trpc.order.kitchenDone.queryOptions({ storeId, limit: 20 }),
	list: (storeId: string) =>
		trpc.order.listByStore.queryOptions({ storeId, limit: 50 }),
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook for creating a refund.
 * Supports full or partial refunds for paid orders.
 */
export function useCreateMollieRefund(storeId: string, orderId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.order.createRefund.mutationKey(),
		mutationFn: async (input: {
			orderId: string;
			amount?: number;
			description?: string;
		}) => {
			return trpcClient.order.createRefund.mutate({
				orderId: input.orderId,
				amount: input.amount,
				description: input.description,
			});
		},
		onSuccess: (result) => {
			// Invalidate order queries to refresh status
			queryClient.invalidateQueries({
				queryKey: trpc.order.getById.queryKey({ orderId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.order.listByStore.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.order.listForKitchen.queryKey({ storeId, limit: 50 }),
			});

			// Show success message based on refund type
			if (result.isPartialRefund) {
				toast.success(t("success.orderPartiallyRefunded"));
			} else {
				toast.success(t("success.orderRefunded"));
			}
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error ? error.message : t("error.createRefund");
			toast.error(message);
		},
	});
}

/**
 * Hook for cancelling an order.
 */
export function useCancelOrder(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.order.cancel.mutationKey(),
		mutationFn: async (input: { orderId: string; reason?: string }) => {
			return trpcClient.order.cancel.mutate({
				orderId: input.orderId,
				reason: input.reason,
			});
		},
		onSuccess: () => {
			// Invalidate order queries to refresh status
			queryClient.invalidateQueries({
				queryKey: trpc.order.listByStore.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.order.listForKitchen.queryKey({ storeId, limit: 50 }),
			});

			toast.success(t("success.orderCancelled"));
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error ? error.message : t("error.cancelOrder");
			toast.error(message);
		},
	});
}

/**
 * Hook for updating order status.
 */
export function useUpdateOrderStatus(storeId: string, orderId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.order.updateStatus.mutationKey(),
		mutationFn: async (status: OrderStatus) => {
			return trpcClient.order.updateStatus.mutate({
				orderId,
				status,
			});
		},
		onSuccess: () => {
			// Invalidate order queries to refresh status
			queryClient.invalidateQueries({
				queryKey: trpc.order.getById.queryKey({ orderId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.order.listByStore.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.order.listForKitchen.queryKey({ storeId, limit: 50 }),
			});
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error ? error.message : t("error.updateOrderStatus");
			toast.error(message);
		},
	});
}
