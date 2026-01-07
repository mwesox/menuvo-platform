/**
 * TanStack Query configuration for orders.
 *
 * Provides query keys, query options factories, and mutation hooks
 * for order-related data fetching and mutations.
 *
 * Uses Effect error handling for typed error responses.
 */

import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { createErrorHandler } from "@/lib/errors";
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
	getKitchenDoneOrders,
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
	byStore: (storeId: string) => [...orderKeys.all, "store", storeId] as const,
	byStoreFiltered: (
		storeId: string,
		filters?: {
			status?: OrderStatus;
			paymentStatus?: PaymentStatus;
			orderType?: OrderType;
		},
	) => [...orderKeys.byStore(storeId), filters] as const,

	// Kitchen queries
	kitchen: (storeId: string) => [...orderKeys.all, "kitchen", storeId] as const,
	kitchenDone: (storeId: string) =>
		[...orderKeys.all, "kitchen-done", storeId] as const,

	// Single order
	detail: (orderId: string) => [...orderKeys.all, "detail", orderId] as const,
};

// ============================================================================
// QUERY OPTIONS
// ============================================================================

export const orderQueries = {
	/**
	 * Get orders for a store with optional filters
	 */
	byStore: (
		storeId: string,
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
	kitchen: (storeId: string) =>
		queryOptions({
			queryKey: orderKeys.kitchen(storeId),
			queryFn: () => getKitchenOrders({ data: { storeId } }),
			enabled: !!storeId,
			// Refetch frequently for real-time feel
			refetchInterval: POLLING_INTERVALS.KITCHEN,
			staleTime: 2000,
		}),

	/**
	 * Get completed orders for kitchen Done archive (last 2 hours)
	 */
	kitchenDone: (storeId: string) =>
		queryOptions({
			queryKey: orderKeys.kitchenDone(storeId),
			queryFn: () => getKitchenDoneOrders({ data: { storeId } }),
			enabled: !!storeId,
			// Less frequent polling - done orders are less critical
			refetchInterval: 60_000, // 1 minute
			staleTime: 30_000,
		}),

	/**
	 * Get single order by ID
	 */
	detail: (orderId: string) =>
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
export function useCreateOrder(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Parameters<typeof createOrder>[0]) =>
			createOrder(input),
		onSuccess: () => {
			// Invalidate store orders
			queryClient.invalidateQueries({
				queryKey: orderKeys.byStore(storeId),
			});
			// Don't show toast - let the checkout flow handle messaging
		},
		onError: createErrorHandler(
			{
				DatabaseError: (e) => {
					ordersLogger.error({ error: e }, "Order creation failed");
					toast.error(t("error.createOrder"));
				},
			},
			(e) => {
				ordersLogger.error({ error: e }, "Order creation failed");
				toast.error(t("error.createOrder"));
			},
		),
	});
}

/**
 * Create Stripe checkout session for an order
 */
export function useCreateCheckoutSession() {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Parameters<typeof createCheckoutSession>[0]) =>
			createCheckoutSession(input),
		onSuccess: (_result, variables) => {
			// Invalidate the order to reflect updated payment status
			queryClient.invalidateQueries({
				queryKey: orderKeys.detail(variables.data.orderId),
			});
		},
		onError: createErrorHandler(
			{
				OrderNotAwaitingPayment: () =>
					toast.error(t("error.orderNotAwaitingPayment")),
				PaymentAlreadyInitiated: () =>
					toast.error(t("error.paymentAlreadyInitiated")),
				NotFoundError: () => toast.error(t("error.orderNotFound")),
				StripeOperation: (e) =>
					toast.error(t("error.stripeError", { details: e.context?.details })),
			},
			() => toast.error(t("error.createCheckout")),
		),
	});
}

/**
 * Update order status
 */
export function useUpdateOrderStatus(storeId: string, orderId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Parameters<typeof updateOrderStatus>[0]) =>
			updateOrderStatus(input),
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
		onError: createErrorHandler(
			{
				InvalidOrderTransition: (e) =>
					toast.error(
						t("error.invalidOrderTransition", {
							from: e.context?.from,
							to: e.context?.to,
						}),
					),
				NotFoundError: () => toast.error(t("error.orderNotFound")),
			},
			() => toast.error(t("error.updateOrderStatus")),
		),
	});
}

/**
 * Cancel an order
 */
export function useCancelOrder(storeId: string, orderId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Parameters<typeof cancelOrder>[0]) =>
			cancelOrder(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orderKeys.byStore(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.kitchen(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.kitchenDone(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.detail(orderId),
			});

			toast.success(t("success.orderCancelled"));
		},
		onError: createErrorHandler(
			{
				OrderNotCancellable: (e) =>
					toast.error(
						t("error.orderNotCancellable", { status: e.context?.status }),
					),
				NotFoundError: () => toast.error(t("error.orderNotFound")),
			},
			() => toast.error(t("error.cancelOrder")),
		),
	});
}

/**
 * Add merchant notes to an order
 */
export function useAddMerchantNotes(orderId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Parameters<typeof addMerchantNotes>[0]) =>
			addMerchantNotes(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orderKeys.detail(orderId),
			});

			toast.success(t("success.notesSaved"));
		},
		onError: createErrorHandler({}, () => toast.error(t("error.saveNotes"))),
	});
}

/**
 * Expire checkout session (cancel payment)
 */
export function useExpireCheckoutSession(storeId: string, orderId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Parameters<typeof expireCheckoutSession>[0]) =>
			expireCheckoutSession(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: orderKeys.detail(orderId),
			});
			queryClient.invalidateQueries({
				queryKey: orderKeys.byStore(storeId),
			});
		},
		onError: createErrorHandler(
			{
				NoCheckoutSession: () => toast.error(t("error.noCheckoutSession")),
				SessionNotExpirable: () => toast.error(t("error.sessionNotExpirable")),
			},
			() => toast.error(t("error.cancelPayment")),
		),
	});
}
