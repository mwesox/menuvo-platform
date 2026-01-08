/**
 * Console order queries and mutations using tRPC
 *
 * Migrated from TanStack Start server functions to tRPC client calls.
 * Uses the tRPC v11 pattern with queryOptions() and mutationOptions().
 */

import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpcClient } from "@/lib/trpc";
import type { OrderStatus } from "./types";

// Note: orderKeys is imported from shop orders feature - shared between shop and console
export const orderKeys = {
	all: ["orders"] as const,
	byStore: (storeId: string) => ["orders", "store", storeId] as const,
	detail: (orderId: string) => ["orders", orderId] as const,
	kitchen: (storeId: string) => ["orders", "kitchen", storeId] as const,
	kitchenDone: (storeId: string) =>
		["orders", "kitchen-done", storeId] as const,
};

// Query options for orders
export const orderQueries = {
	byStore: (storeId: string) =>
		queryOptions({
			queryKey: orderKeys.byStore(storeId),
			queryFn: async () => {
				return trpcClient.order.listByStore.query({ storeId });
			},
		}),
	detail: (orderId: string) =>
		queryOptions({
			queryKey: orderKeys.detail(orderId),
			queryFn: async () => {
				return trpcClient.order.getById.query({ id: orderId });
			},
		}),
	kitchen: (storeId: string) =>
		queryOptions({
			queryKey: orderKeys.kitchen(storeId),
			queryFn: async () => {
				return trpcClient.order.listForKitchen.query({ storeId });
			},
		}),
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook for creating a refund.
 * Supports full or partial refunds for paid orders.
 */
export function useCreateMollieRefund(storeId: string, orderId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
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
				queryKey: orderKeys.detail(orderId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.byStore(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.kitchen(storeId),
			});

			// Show success message based on refund type
			if (result.isPartialRefund) {
				toast.success(t("success.orderPartiallyRefunded"));
			} else {
				toast.success(t("success.orderRefunded"));
			}
		},
		onError: (error: Error) => {
			toast.error(error.message || t("error.createRefund"));
		},
	});
}

/**
 * Hook for cancelling an order.
 */
export function useCancelOrder(storeId: string, orderId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: async () => {
			return trpcClient.order.updateStatus.mutate({
				id: orderId,
				status: "cancelled",
			});
		},
		onSuccess: () => {
			// Invalidate order queries to refresh status
			queryClient.invalidateQueries({
				queryKey: orderKeys.detail(orderId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.byStore(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.kitchen(storeId),
			});

			toast.success(t("success.orderCancelled"));
		},
		onError: (error: Error) => {
			toast.error(error.message || t("error.cancelOrder"));
		},
	});
}

/**
 * Hook for updating order status.
 */
export function useUpdateOrderStatus(storeId: string, orderId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: async (status: OrderStatus) => {
			return trpcClient.order.updateStatus.mutate({
				id: orderId,
				status,
			});
		},
		onSuccess: () => {
			// Invalidate order queries to refresh status
			queryClient.invalidateQueries({
				queryKey: orderKeys.detail(orderId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.byStore(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.kitchen(storeId),
			});
		},
		onError: (error: Error) => {
			toast.error(error.message || t("error.updateOrderStatus"));
		},
	});
}
