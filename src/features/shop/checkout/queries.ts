import { queryOptions, useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import {
	createCheckoutSession,
	getCheckoutSessionStatus,
} from "@/features/orders/server/stripe-checkout.functions";
import { getStorePaymentCapability } from "../server/shop.functions";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const checkoutKeys = {
	/**
	 * Base key for all checkout-related queries.
	 */
	all: ["checkout"] as const,

	/**
	 * Key for checkout session status queries.
	 */
	session: (sessionId: string) =>
		[...checkoutKeys.all, "session", sessionId] as const,

	/**
	 * Key for store payment capability queries.
	 */
	paymentCapability: (slug: string) =>
		[...checkoutKeys.all, "paymentCapability", slug] as const,
};

// ============================================================================
// QUERY OPTIONS
// ============================================================================

export const checkoutQueries = {
	/**
	 * Query options for fetching checkout session status.
	 * Polls every 2 seconds while payment is pending.
	 */
	sessionStatus: (sessionId: string | null) =>
		queryOptions({
			queryKey: sessionId ? checkoutKeys.session(sessionId) : ["empty"],
			queryFn: () => {
				if (!sessionId) {
					throw new Error("Session ID is required");
				}
				return getCheckoutSessionStatus({ data: { sessionId } });
			},
			enabled: !!sessionId,
			refetchInterval: (query) => {
				const status = query.state.data?.paymentStatus;
				// Keep polling while awaiting confirmation
				return status === "awaiting_confirmation" ? 2000 : false;
			},
		}),

	/**
	 * Query options for checking if a store accepts online payments.
	 */
	paymentCapability: (slug: string) =>
		queryOptions({
			queryKey: checkoutKeys.paymentCapability(slug),
			queryFn: () => getStorePaymentCapability({ data: { slug } }),
			staleTime: 1000 * 60 * 5, // 5 minutes
		}),
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook for polling checkout session status.
 * Automatically polls while payment is in progress.
 */
export function useCheckoutSessionStatus(sessionId: string | null) {
	return useQuery(checkoutQueries.sessionStatus(sessionId));
}

/**
 * Hook for checking if a store accepts online payments.
 */
export function useStorePaymentCapability(slug: string) {
	return useQuery(checkoutQueries.paymentCapability(slug));
}

/**
 * Hook for creating a checkout session.
 * Returns clientSecret for rendering embedded checkout.
 */
export function useCreateCheckoutSession() {
	const router = useRouter();

	return useMutation({
		mutationFn: createCheckoutSession,
		onError: (error) => {
			toast.error(error.message || "Failed to create checkout session");
		},
		onSuccess: () => {
			// Invalidate any cached order data
			router.invalidate();
		},
	});
}
