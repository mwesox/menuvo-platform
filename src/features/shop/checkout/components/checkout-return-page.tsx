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
import { useCheckoutSessionStatus, useMolliePaymentStatus } from "../queries";

interface CheckoutReturnPageProps {
	storeSlug: string;
}

/**
 * Handles post-payment redirect from both:
 * - Stripe Embedded Checkout (session_id in URL)
 * - Mollie Hosted Checkout (order_id in URL)
 *
 * Polls for payment confirmation and redirects to order confirmation on success.
 */
export function CheckoutReturnPage({ storeSlug }: CheckoutReturnPageProps) {
	const { t } = useTranslation("shop");
	const navigate = useNavigate();
	const search = useSearch({ from: "/shop/$slug/checkout/return" });

	// Stripe session ID from query params
	const sessionId = search.session_id;

	// Mollie order ID from query params (added by our return URL)
	const orderId = search.order_id ? Number(search.order_id) : null;

	// Query for order details (to get Mollie payment ID)
	const { data: order } = useQuery({
		...orderQueries.detail(orderId ?? 0),
		enabled: !!orderId && !sessionId,
	});

	// Stripe: Poll checkout session status
	const stripeStatus = useCheckoutSessionStatus(sessionId ?? null);

	// Mollie: Poll payment status using the payment ID from the order
	const molliePaymentId = order?.molliePaymentId ?? null;
	const mollieStatus = useMolliePaymentStatus(molliePaymentId);

	// Determine which provider we're dealing with
	const isMollie = !!orderId && !sessionId;

	// Get the relevant status data
	const data = isMollie ? mollieStatus.data : stripeStatus.data;
	const isLoading = isMollie
		? mollieStatus.isLoading || (!molliePaymentId && !!orderId)
		: stripeStatus.isLoading;
	const isError = isMollie ? mollieStatus.isError : stripeStatus.isError;

	// Redirect to order confirmation when payment is confirmed
	useEffect(() => {
		const targetOrderId = data?.orderId ?? orderId;
		if (data?.paymentStatus === "paid" && targetOrderId) {
			navigate({
				to: "/shop/$slug/order/$orderId",
				params: { slug: storeSlug, orderId: String(targetOrderId) },
			});
		}
	}, [data, orderId, storeSlug, navigate]);

	// Show loading state while verifying payment
	if (isLoading || data?.paymentStatus === "awaiting_confirmation") {
		return (
			<div className="min-h-screen bg-background">
				<div className="max-w-lg mx-auto px-4 py-12">
					<ShopCard padding="lg" className="text-center space-y-4">
						<Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
						<ShopHeading as="h1" size="lg">
							{t("checkout.return.verifying")}
						</ShopHeading>
						<ShopMutedText>{t("checkout.return.pleaseWait")}</ShopMutedText>
					</ShopCard>
				</div>
			</div>
		);
	}

	// Show error state if payment failed or expired
	if (
		isError ||
		data?.paymentStatus === "failed" ||
		data?.paymentStatus === "expired"
	) {
		return (
			<div className="min-h-screen bg-background">
				<div className="max-w-lg mx-auto px-4 py-12">
					<ShopCard padding="lg" className="text-center space-y-4">
						<div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
							<span className="text-destructive text-2xl">!</span>
						</div>
						<ShopHeading as="h1" size="lg">
							{t("checkout.return.paymentFailed")}
						</ShopHeading>
						<ShopMutedText>
							{data?.paymentStatus === "expired"
								? t("checkout.return.sessionExpired")
								: t("checkout.return.tryAgain")}
						</ShopMutedText>
					</ShopCard>
				</div>
			</div>
		);
	}

	// Fallback for unexpected states
	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-lg mx-auto px-4 py-12">
				<ShopCard padding="lg" className="text-center space-y-4">
					<Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
					<ShopHeading as="h1" size="lg">
						{t("checkout.return.processing")}
					</ShopHeading>
				</ShopCard>
			</div>
		</div>
	);
}
