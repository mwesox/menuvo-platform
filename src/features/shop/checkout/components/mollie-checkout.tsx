"use client";

import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ShopButton, ShopCard, ShopHeading } from "../../shared/components/ui";
import { useCreatePayment } from "../queries";

interface MollieCheckoutProps {
	orderId: number;
	storeSlug: string;
}

/**
 * Mollie checkout component.
 * Handles redirect-based checkout where customer is sent to Mollie hosted page.
 *
 * Flow:
 * 1. Customer clicks "Pay Now" button
 * 2. Create Mollie payment via server function
 * 3. Redirect to Mollie hosted checkout page
 * 4. Customer completes payment on Mollie
 * 5. Customer redirects back to return URL
 * 6. Webhook updates order status
 */
export function MollieCheckout({ orderId, storeSlug }: MollieCheckoutProps) {
	const { t } = useTranslation("shop");
	const createPayment = useCreatePayment();

	const handlePayNow = async () => {
		const returnUrl = `${window.location.origin}/${storeSlug}/checkout/return`;

		const result = await createPayment.mutateAsync({
			orderId,
			returnUrl,
		});

		if (result.checkoutUrl) {
			// Redirect to Mollie hosted checkout page
			window.location.href = result.checkoutUrl;
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-lg mx-auto px-4 py-6">
				<ShopHeading as="h1" size="xl" className="mb-6">
					{t("checkout.payment")}
				</ShopHeading>

				<ShopCard padding="lg" className="space-y-6">
					<div className="text-center space-y-3">
						<ShopHeading as="h2" size="md">
							{t("checkout.payment.title")}
						</ShopHeading>
						<p className="text-sm text-muted-foreground">
							{t("checkout.payment.description")}
						</p>
					</div>

					{/* Payment method icons */}
					<div className="flex justify-center gap-4 py-4">
						<PaymentMethodIcon name="iDEAL" />
						<PaymentMethodIcon name="Card" />
						<PaymentMethodIcon name="PayPal" />
						<PaymentMethodIcon name="Bancontact" />
					</div>

					{createPayment.isError && (
						<div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center">
							{t("checkout.payment.error")}
						</div>
					)}

					<ShopButton
						variant="primary"
						size="lg"
						className="w-full"
						onClick={handlePayNow}
						disabled={createPayment.isPending}
					>
						{createPayment.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								{t("checkout.payment.redirecting")}
							</>
						) : (
							t("checkout.payment.payNow")
						)}
					</ShopButton>

					<p className="text-xs text-muted-foreground text-center">
						{t("checkout.payment.securePayment")}
					</p>
				</ShopCard>
			</div>
		</div>
	);
}

/**
 * Payment method icon placeholder.
 * In production, use actual payment method logos from Mollie.
 */
function PaymentMethodIcon({ name }: { name: string }) {
	return (
		<div className="flex flex-col items-center gap-1">
			<div className="w-12 h-8 rounded border bg-muted flex items-center justify-center">
				<span className="text-[10px] font-medium text-muted-foreground">
					{name}
				</span>
			</div>
		</div>
	);
}
