"use client";

import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { orderQueries } from "@/features/orders/queries";
import {
	ShopCard,
	ShopHeading,
	ShopMutedText,
} from "../../shared/components/ui";
import { useCheckoutSessionStatus, usePaymentStatus } from "../queries";

interface CheckoutReturnPageProps {
	storeSlug: string;
}

/**
 * Handles post-payment redirect from both:
 * - Stripe Embedded Checkout (session_id in URL)
 * - Redirect Checkout (order_id in URL)
 *
 * For synchronous payment methods (credit cards, PayPal), the status is immediately
 * final when the user returns from Mollie - no polling needed.
 * Redirects to order confirmation on success, shows error state otherwise.
 */
export function CheckoutReturnPage({ storeSlug }: CheckoutReturnPageProps) {
	const { t } = useTranslation("shop");
	const navigate = useNavigate();
	const search = useSearch({ from: "/$slug/checkout/return" });

	// Stripe session ID from query params
	const sessionId = search.session_id;

	// Order ID from query params (added by our return URL for redirect checkout)
	const orderId = search.order_id ?? null;

	// Query for order details (to get payment ID)
	const { data: order } = useQuery({
		...orderQueries.detail(orderId ?? ""),
		enabled: !!orderId && !sessionId,
	});

	// Stripe: Poll checkout session status
	const stripeStatus = useCheckoutSessionStatus(sessionId ?? null);

	// Redirect checkout: Fetch payment status using the payment ID from the order
	const paymentId = order?.molliePaymentId ?? null;
	const redirectPaymentStatus = usePaymentStatus(paymentId);

	// Determine which checkout flow we're handling
	const isRedirectCheckout = !!orderId && !sessionId;

	// Get the relevant status data
	const data = isRedirectCheckout
		? redirectPaymentStatus.data
		: stripeStatus.data;
	const isLoading = isRedirectCheckout
		? redirectPaymentStatus.isLoading || (!paymentId && !!orderId)
		: stripeStatus.isLoading;
	const isError = isRedirectCheckout
		? redirectPaymentStatus.isError
		: stripeStatus.isError;

	// Redirect to order confirmation when payment is confirmed
	useEffect(() => {
		const targetOrderId = data?.orderId ?? orderId;
		if (data?.paymentStatus === "paid" && targetOrderId) {
			navigate({
				to: "/$slug/order/$orderId",
				params: { slug: storeSlug, orderId: String(targetOrderId) },
			});
		}
	}, [data, orderId, storeSlug, navigate]);

	// Show loading state only during initial fetch
	if (isLoading) {
		return (
			<div className="min-h-screen bg-background">
				<div className="mx-auto max-w-lg px-4 py-12">
					<ShopCard padding="lg" className="space-y-4 text-center">
						<Loader2 className="mx-auto size-12 animate-spin text-primary" />
						<ShopHeading as="h1" size="lg">
							{t("checkout.return.verifying")}
						</ShopHeading>
						<ShopMutedText>{t("checkout.return.pleaseWait")}</ShopMutedText>
					</ShopCard>
				</div>
			</div>
		);
	}

	// Show error state for any non-paid status or query error
	// For synchronous payment methods (credit cards, PayPal), the status is
	// immediately final when user returns - no need to poll or wait
	const errorMessage = isError
		? t("checkout.return.tryAgain")
		: data?.paymentStatus === "expired"
			? t("checkout.return.sessionExpired")
			: t("checkout.return.tryAgain");

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-lg px-4 py-12">
				<ShopCard padding="lg" className="space-y-4 text-center">
					<div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
						<span className="text-2xl text-destructive">!</span>
					</div>
					<ShopHeading as="h1" size="lg">
						{t("checkout.return.paymentFailed")}
					</ShopHeading>
					<ShopMutedText>{errorMessage}</ShopMutedText>
				</ShopCard>
			</div>
		</div>
	);
}
