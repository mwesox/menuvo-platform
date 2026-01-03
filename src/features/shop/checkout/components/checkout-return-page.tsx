"use client";

import { useNavigate, useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
	ShopCard,
	ShopHeading,
	ShopMutedText,
} from "../../shared/components/ui";
import { useCheckoutSessionStatus } from "../queries";

interface CheckoutReturnPageProps {
	storeSlug: string;
}

/**
 * Handles post-payment redirect from Stripe Embedded Checkout.
 * Polls for payment confirmation and redirects to order confirmation on success.
 */
export function CheckoutReturnPage({ storeSlug }: CheckoutReturnPageProps) {
	const { t } = useTranslation("shop");
	const navigate = useNavigate();
	const search = useSearch({ from: "/shop/$slug/checkout/return" });
	const sessionId = search.session_id;

	const { data, isLoading, isError } = useCheckoutSessionStatus(
		sessionId ?? null,
	);

	// Redirect to order confirmation when payment is confirmed
	useEffect(() => {
		if (data?.paymentStatus === "paid" && data.orderId) {
			navigate({
				to: "/shop/$slug/order/$orderId",
				params: { slug: storeSlug, orderId: String(data.orderId) },
			});
		}
	}, [data, storeSlug, navigate]);

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
