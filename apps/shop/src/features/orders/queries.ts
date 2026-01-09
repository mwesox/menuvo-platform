/**
 * TanStack Query configuration for orders in the Shop app.
 *
 * Provides query keys and query options for order-related data fetching.
 * Shop app only needs read access to view order status after checkout.
 */

import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { trpcClient } from "../../lib/trpc";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const orderKeys = {
	all: ["orders"] as const,

	// Single order
	detail: (orderId: string) => [...orderKeys.all, "detail", orderId] as const,
};

// ============================================================================
// QUERY OPTIONS
// ============================================================================

export const orderQueries = {
	/**
	 * Get single order by ID
	 * Used to show order status after checkout
	 */
	detail: (orderId: string) =>
		queryOptions({
			queryKey: orderKeys.detail(orderId),
			queryFn: () => trpcClient.order.getById.query({ orderId }),
			enabled: !!orderId,
			staleTime: 30_000, // 30 seconds - orders need near-real-time updates
			// Poll for status updates while viewing order
			refetchInterval: 15_000, // 15 seconds
		}),
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

interface CreateOrderInput {
	data: {
		storeId: string;
		items: Array<{
			itemId: string;
			name: string;
			kitchenName?: string | null;
			description?: string;
			quantity: number;
			unitPrice: number;
			optionsPrice: number;
			totalPrice: number;
			options: Array<{
				optionGroupId: string;
				optionChoiceId: string;
				groupName: string;
				choiceName: string;
				quantity: number;
				priceModifier: number;
			}>;
		}>;
		orderType: string;
		customerName: string;
		customerNotes?: string;
		paymentMethod: string;
		subtotal: number;
		taxAmount: number;
		tipAmount: number;
		totalAmount: number;
	};
}

/**
 * Hook to create a new order
 * TODO: Replace stub with actual tRPC procedure once implemented
 */
export function useCreateOrder(_storeId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (_input: CreateOrderInput): Promise<{ id: string }> => {
			// TODO: Implement with actual tRPC procedure
			// return trpcClient.order.create.mutate(_input.data);
			throw new Error(
				"useCreateOrder not implemented - order.create procedure needed",
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: orderKeys.all });
		},
		onError: (error) => {
			toast.error(error.message || "Failed to create order");
		},
	});
}
