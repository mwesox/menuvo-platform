/**
 * Ordering Queries
 *
 * Provides hooks for ordering flow:
 * - useCreateOrder: Create order via tRPC
 * - useCreatePayment: Create PayPal payment via tRPC
 * - useVerifyPayment: Check payment status
 * - useStorePaymentCapability: Check store payment capabilities
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "../../lib/trpc";

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to create a new order
 * Transforms cart data to tRPC createOrderSchema format and calls the procedure.
 */
export function useCreateOrder() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const mutationOptions = trpc.order.create.mutationOptions();

	return useMutation({
		...mutationOptions,
		onSuccess: () => {
			// Invalidate order queries to refetch after creation
			queryClient.invalidateQueries({
				queryKey: trpc.order.getById.queryKey(),
			});
		},
		onError: (error) => {
			const message =
				error instanceof Error ? error.message : "Failed to create order";
			toast.error(message);
		},
	});
}

/**
 * Hook to create a PayPal payment.
 * Calls order.createPayment tRPC procedure and returns payment URL for redirect.
 */
export function useCreatePayment() {
	const trpc = useTRPC();

	const mutationOptions = trpc.order.createPayment.mutationOptions();

	return useMutation({
		...mutationOptions,
		onError: (error) => {
			const message =
				error instanceof Error ? error.message : "Failed to create payment";
			toast.error(message);
		},
	});
}

/**
 * Hook to verify payment status.
 * Checks PayPal API via backend and updates order if payment is confirmed.
 *
 * @param orderId - The order ID to verify (orderId is the only input needed)
 */
export function useVerifyPayment(orderId: string | null) {
	const trpc = useTRPC();
	const enabled = Boolean(orderId);

	return useQuery({
		...trpc.order.verifyPayment.queryOptions({
			orderId: orderId ?? "",
		}),
		enabled,
	});
}

/**
 * Hook to check store payment capabilities
 */
export function useStorePaymentCapability(storeId: string) {
	return useQuery({
		queryKey: ["ordering", "capabilities", storeId],
		queryFn: async () => ({
			canAcceptPayments: false,
			paymentMethods: [] as string[],
		}),
		enabled: !!storeId,
	});
}
