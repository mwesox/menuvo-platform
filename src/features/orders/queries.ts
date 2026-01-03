/**
 * TanStack Query configuration for orders.
 *
 * Provides query keys, query options factories, and mutation hooks
 * for order-related data fetching and mutations.
 */

import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ordersLogger } from "@/lib/logger";
import {
	type OrderStatus,
	type OrderType,
	type PaymentStatus,
	POLLING_INTERVALS,
} from "./constants";
import {
	addMerchantNotes,
	cancelOrder,
	createOrder,
	getKitchenOrders,
	getOrder,
	getOrdersByStore,
	updateOrderStatus,
} from "./server/orders.functions";
import {
	createCheckoutSession,
	expireCheckoutSession,
} from "./server/stripe-checkout.functions";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const orderKeys = {
	all: ["orders"] as const,

	// Store-scoped queries
	byStore: (storeId: number) => [...orderKeys.all, "store", storeId] as const,
	byStoreFiltered: (
		storeId: number,
		filters?: {
			status?: OrderStatus;
			paymentStatus?: PaymentStatus;
			orderType?: OrderType;
		},
	) => [...orderKeys.byStore(storeId), filters] as const,

	// Kitchen queries
	kitchen: (storeId: number) => [...orderKeys.all, "kitchen", storeId] as const,

	// Single order
	detail: (orderId: number) => [...orderKeys.all, "detail", orderId] as const,
};

// ============================================================================
// QUERY OPTIONS
// ============================================================================

export const orderQueries = {
	/**
	 * Get orders for a store with optional filters
	 */
	byStore: (
		storeId: number,
		options?: {
			status?: OrderStatus;
			paymentStatus?: PaymentStatus;
			orderType?: OrderType;
			fromDate?: string;
			toDate?: string;
			search?: string;
			limit?: number;
			offset?: number;
		},
	) =>
		queryOptions({
			queryKey: orderKeys.byStoreFiltered(storeId, {
				status: options?.status,
				paymentStatus: options?.paymentStatus,
				orderType: options?.orderType,
			}),
			queryFn: () =>
				getOrdersByStore({
					data: {
						storeId,
						...options,
					},
				}),
			enabled: !!storeId,
			staleTime: 30_000, // 30 seconds - orders need near-real-time updates
		}),

	/**
	 * Get orders for kitchen monitor (active orders only)
	 */
	kitchen: (storeId: number) =>
		queryOptions({
			queryKey: orderKeys.kitchen(storeId),
			queryFn: () => getKitchenOrders({ data: { storeId } }),
			enabled: !!storeId,
			// Refetch frequently for real-time feel
			refetchInterval: POLLING_INTERVALS.KITCHEN,
			staleTime: 2000,
		}),

	/**
	 * Get single order by ID
	 */
	detail: (orderId: number) =>
		queryOptions({
			queryKey: orderKeys.detail(orderId),
			queryFn: () => getOrder({ data: { orderId } }),
			enabled: !!orderId,
			staleTime: 30_000, // 30 seconds - orders need near-real-time updates
		}),
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new order
 */
export function useCreateOrder(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: createOrder,
		onSuccess: () => {
			// Invalidate store orders
			queryClient.invalidateQueries({
				queryKey: orderKeys.byStore(storeId),
			});
			// Don't show toast - let the checkout flow handle messaging
		},
		onError: (error) => {
			ordersLogger.error({ error }, "Order creation failed");
			toast.error(t("error.createOrder"));
		},
	});
}

/**
 * Create Stripe checkout session for an order
 */
export function useCreateCheckoutSession() {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: createCheckoutSession,
		onSuccess: (_result, variables) => {
			// Invalidate the order to reflect updated payment status
			queryClient.invalidateQueries({
				queryKey: orderKeys.detail(variables.data.orderId),
			});
		},
		onError: () => {
			toast.error(t("error.createCheckout"));
		},
	});
}

/**
 * Update order status
 */
export function useUpdateOrderStatus(storeId: number, orderId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: updateOrderStatus,
		onSuccess: () => {
			// Invalidate all related queries
			queryClient.invalidateQueries({
				queryKey: orderKeys.byStore(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.kitchen(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.detail(orderId),
			});

			toast.success(t("success.orderStatusUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateOrderStatus"));
		},
	});
}

/**
 * Cancel an order
 */
export function useCancelOrder(storeId: number, orderId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: cancelOrder,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orderKeys.byStore(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.kitchen(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.detail(orderId),
			});

			toast.success(t("success.orderCancelled"));
		},
		onError: () => {
			toast.error(t("error.cancelOrder"));
		},
	});
}

/**
 * Add merchant notes to an order
 */
export function useAddMerchantNotes(orderId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: addMerchantNotes,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orderKeys.detail(orderId),
			});

			toast.success(t("success.notesSaved"));
		},
		onError: () => {
			toast.error(t("error.saveNotes"));
		},
	});
}

/**
 * Expire checkout session (cancel payment)
 */
export function useExpireCheckoutSession(storeId: number, orderId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: expireCheckoutSession,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orderKeys.detail(orderId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.byStore(storeId),
			});
		},
		onError: () => {
			toast.error(t("error.cancelPayment"));
		},
	});
}
