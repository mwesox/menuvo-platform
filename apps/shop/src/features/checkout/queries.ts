/**
 * Checkout Queries - Stub File
 *
 * TODO: These need to be properly implemented to work with tRPC procedures.
 * Currently stubbed out to unblock the build process.
 *
 * Required implementations:
 * - useCreateCheckoutSession: Create Stripe checkout session
 * - useCheckoutSessionStatus: Check Stripe session status
 * - usePaymentStatus: Check payment status
 * - useCreatePayment: Create Mollie payment
 * - useStorePaymentCapability: Check store payment capabilities
 */

import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const checkoutKeys = {
	all: ["checkout"] as const,
	session: (sessionId: string) =>
		[...checkoutKeys.all, "session", sessionId] as const,
	payment: (orderId: string) =>
		[...checkoutKeys.all, "payment", orderId] as const,
	capabilities: (storeId: string) =>
		[...checkoutKeys.all, "capabilities", storeId] as const,
};

// ============================================================================
// QUERY OPTIONS
// ============================================================================

export const checkoutQueries = {
	sessionStatus: (sessionId: string) =>
		queryOptions({
			queryKey: checkoutKeys.session(sessionId),
			// TODO: Implement actual query
			queryFn: async (): Promise<{
				orderId: string | null;
				paymentStatus: "pending" | "paid" | "expired" | "failed";
			}> => ({ orderId: null, paymentStatus: "pending" }),
			enabled: !!sessionId,
		}),

	paymentStatus: (orderId: string) =>
		queryOptions({
			queryKey: checkoutKeys.payment(orderId),
			// TODO: Implement actual query
			queryFn: async (): Promise<{
				orderId: string | null;
				paymentStatus: "pending" | "paid" | "expired" | "failed";
			}> => ({ orderId: null, paymentStatus: "pending" }),
			enabled: !!orderId,
		}),

	storeCapabilities: (storeId: string) =>
		queryOptions({
			queryKey: checkoutKeys.capabilities(storeId),
			// TODO: Implement actual query
			queryFn: async () => ({
				canAcceptPayments: false,
				paymentMethods: [] as string[],
			}),
			enabled: !!storeId,
		}),
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to create a Stripe checkout session
 * TODO: Implement with actual tRPC procedure
 */
export function useCreateCheckoutSession() {
	return useMutation({
		mutationFn: async (_input: {
			storeId: string;
			items: Array<{ itemId: string; quantity: number }>;
			returnUrl: string;
		}) => {
			// TODO: Implement actual mutation
			throw new Error("useCreateCheckoutSession not implemented");
		},
	});
}

/**
 * Hook to check Stripe checkout session status
 */
export function useCheckoutSessionStatus(sessionId: string | null) {
	return useQuery({
		...checkoutQueries.sessionStatus(sessionId ?? ""),
		enabled: !!sessionId,
	});
}

/**
 * Hook to create a Mollie payment
 * TODO: Implement with actual tRPC procedure
 */
export function useCreatePayment() {
	return useMutation({
		mutationFn: async (_input: {
			orderId: string;
			returnUrl: string;
		}): Promise<{ checkoutUrl: string }> => {
			// TODO: Implement actual mutation
			throw new Error("useCreatePayment not implemented");
		},
	});
}

/**
 * Hook to check payment status
 */
export function usePaymentStatus(orderId: string | null) {
	return useQuery({
		...checkoutQueries.paymentStatus(orderId ?? ""),
		enabled: !!orderId,
	});
}

/**
 * Hook to check store payment capabilities
 */
export function useStorePaymentCapability(storeId: string) {
	return useQuery({
		...checkoutQueries.storeCapabilities(storeId),
		enabled: !!storeId,
	});
}
