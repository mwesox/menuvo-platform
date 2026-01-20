import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ShopButton, ShopCard, ShopHeading } from "../../shared/components/ui";
import { useCreatePayment } from "../queries";

interface MolliePaymentProps {
	orderId: string;
	storeSlug: string;
}

/**
 * Mollie payment component.
 * Handles redirect-based payment where customer is sent to Mollie hosted page.
 *
 * Flow:
 * 1. Customer clicks "Pay Now" button
 * 2. Create Mollie payment via server function
 * 3. Redirect to Mollie hosted payment page
 * 4. Customer completes payment on Mollie
 * 5. Customer redirects back to return URL
 * 6. Webhook updates order status
 */
export function MolliePayment({ orderId, storeSlug }: MolliePaymentProps) {
	const { t } = useTranslation("shop");
	const createPayment = useCreatePayment();

	const handlePayNow = async () => {
		const returnUrl = `${window.location.origin}/${storeSlug}/ordering/return`;

		const result = await createPayment.mutateAsync({
			orderId,
			returnUrl,
		});

		if (result.checkoutUrl) {
			// Redirect to Mollie hosted payment page
			window.location.href = result.checkoutUrl;
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-lg px-4 py-6">
				<ShopHeading as="h1" size="xl" className="mb-6">
					{t("ordering.payment")}
				</ShopHeading>

				<ShopCard padding="lg" className="space-y-6">
					<div className="space-y-3 text-center">
						<ShopHeading as="h2" size="md">
							{t("ordering.payment.title")}
						</ShopHeading>
						<p className="text-muted-foreground text-sm">
							{t("ordering.payment.description")}
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
						<div className="rounded-md bg-destructive/10 p-3 text-center text-destructive text-sm">
							{t("ordering.payment.error")}
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
								<Loader2 className="me-2 size-4 animate-spin" />
								{t("ordering.payment.redirecting")}
							</>
						) : (
							t("ordering.payment.payNow")
						)}
					</ShopButton>

					<p className="text-center text-muted-foreground text-xs">
						{t("ordering.payment.securePayment")}
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
			<div className="flex h-8 w-12 items-center justify-center rounded border bg-muted">
				<span className="font-medium text-[10px] text-muted-foreground">
					{name}
				</span>
			</div>
		</div>
	);
}
