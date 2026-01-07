/**
 * Console order queries and mutations.
 *
 * Provides hooks for order management in the merchant console,
 * including refund functionality.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { orderKeys } from "@/features/orders/queries";
import {
	type CreateMollieRefundInput,
	createMollieRefund,
} from "./server/refunds.functions";

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook for creating a Mollie refund.
 * Supports full or partial refunds for paid Mollie orders.
 */
export function useCreateMollieRefund(storeId: string, orderId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: CreateMollieRefundInput) =>
			createMollieRefund({ data: input }),
		onSuccess: (result: { isFullRefund: boolean }) => {
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
			if (result.isFullRefund) {
				toast.success(t("success.orderRefunded"));
			} else {
				toast.success(t("success.orderPartiallyRefunded"));
			}
		},
		onError: (error) => {
			// Handle specific error types
			if (error instanceof Error) {
				if (error.name === "OrderNotRefundableError") {
					toast.error(t("error.orderNotRefundable"));
				} else if (error.name === "RefundAmountExceedsPaymentError") {
					toast.error(t("error.refundAmountExceeds"));
				} else {
					toast.error(error.message || t("error.refundFailed"));
				}
			} else {
				toast.error(t("error.refundFailed"));
			}
		},
	});
}
