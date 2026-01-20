import type { AppRouter } from "@menuvo/api/trpc";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
	ShopCard,
	ShopHeading,
	ShopMutedText,
} from "../../shared/components/ui";
import { useVerifyPayment } from "../queries";

type RouterOutput = inferRouterOutputs<AppRouter>;
type PaymentStatus = RouterOutput["order"]["verifyPayment"];

interface OrderingReturnPageProps {
	storeSlug: string;
}

/**
 * Handles post-payment redirect from Mollie.
 *
 * For synchronous payment methods (credit cards, PayPal), the status is immediately
 * final when the user returns from Mollie - no polling needed.
 *
 * The backend verifies payment status with Mollie API and updates the order.
 * We only pass orderId - backend handles looking up the payment ID internally.
 */
export function OrderingReturnPage({ storeSlug }: OrderingReturnPageProps) {
	const { t } = useTranslation("shop");
	const navigate = useNavigate();
	const search = useSearch({ from: "/$slug/ordering/return" });

	// Order ID from query params (passed in return URL)
	const orderId = search.order_id ?? null;

	// Verify payment status - backend checks Mollie API and updates order
	const { data, isLoading, isError } = useVerifyPayment(orderId);
	const paymentData = data as PaymentStatus | undefined;

	// Redirect to order confirmation when payment is confirmed
	useEffect(() => {
		if (paymentData?.paymentStatus === "paid" && orderId) {
			navigate({
				to: "/$slug/order/$orderId",
				params: { slug: storeSlug, orderId },
			});
		}
	}, [data, orderId, storeSlug, navigate]);

	// Show loading state during verification
	if (isLoading) {
		return (
			<div className="min-h-screen bg-background">
				<div className="mx-auto max-w-lg px-4 py-12">
					<ShopCard padding="lg" className="space-y-4 text-center">
						<Loader2 className="mx-auto size-12 animate-spin text-primary" />
						<ShopHeading as="h1" size="lg">
							{t("ordering.return.verifying")}
						</ShopHeading>
						<ShopMutedText>{t("ordering.return.pleaseWait")}</ShopMutedText>
					</ShopCard>
				</div>
			</div>
		);
	}

	// Show error state for any non-paid status or query error
	const errorMessage = isError
		? t("ordering.return.tryAgain")
		: paymentData?.paymentStatus === "expired"
			? t("ordering.return.sessionExpired")
			: t("ordering.return.tryAgain");

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-lg px-4 py-12">
				<ShopCard padding="lg" className="space-y-4 text-center">
					<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
						<span className="text-2xl text-destructive">!</span>
					</div>
					<ShopHeading as="h1" size="lg">
						{t("ordering.return.paymentFailed")}
					</ShopHeading>
					<ShopMutedText>{errorMessage}</ShopMutedText>
				</ShopCard>
			</div>
		</div>
	);
}
