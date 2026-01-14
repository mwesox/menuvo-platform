import { Input } from "@menuvo/ui/components/input";
import { Label } from "@menuvo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@menuvo/ui/components/radio-group";
import { Textarea } from "@menuvo/ui/components/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { MerchantCapabilities } from "../../../lib/capabilities";
import type { TrpcClient } from "../../../lib/trpc";
import { useCartStore } from "../../cart/stores/cart-store";
import { StoreUnavailable } from "../../shared/components/store-unavailable";
import {
	ShopButton,
	ShopCard,
	ShopHeading,
	ShopMutedText,
	ShopPrice,
	ShopPriceRow,
} from "../../shared/components/ui";
import { useCreateOrder, useCreatePayment } from "../queries";

type CreateOrderInput = Parameters<TrpcClient["order"]["create"]["mutate"]>[0];
type OrderType = CreateOrderInput["orderType"];

interface OrderingPageProps {
	storeId: string;
	storeSlug: string;
	capabilities: MerchantCapabilities;
}

export function OrderingPage({
	storeId,
	storeSlug,
	capabilities,
}: OrderingPageProps) {
	const { t } = useTranslation("shop");

	// Cart state - compute subtotal from items (getters don't work with persist)
	const items = useCartStore((s) => s.items);
	const clearCart = useCartStore((s) => s.clearCart);

	// Form state
	const [customerName, setCustomerName] = useState("");
	const [customerNotes, setCustomerNotes] = useState("");
	const [orderType, setOrderType] = useState<OrderType>("dine_in");

	// Payment redirect state
	const [isPaymentRedirecting, setIsPaymentRedirecting] = useState(false);

	// Mutations
	const createOrderMutation = useCreateOrder();
	const createPaymentMutation = useCreatePayment();

	// Check if merchant can accept online payments (computed on server)
	if (!capabilities.canAcceptPayments) {
		return <StoreUnavailable backUrl={`/${storeSlug}`} />;
	}

	// Compute subtotal from items
	const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

	const validateForm = (): boolean => {
		if (!customerName.trim()) {
			toast.error(t("ordering.nameRequired"));
			return false;
		}

		if (items.length === 0) {
			toast.error(t("ordering.cartEmpty"));
			return false;
		}

		// Validate cart items have required fields (catches corrupted localStorage)
		const invalidItems = items.filter(
			(item) => !item.name || typeof item.name !== "string",
		);
		if (invalidItems.length > 0) {
			toast.error(t("ordering.invalidCartItems"));
			clearCart();
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		const orderItems = items.map((item) => {
			const options = item.selectedOptions.flatMap((group) =>
				group.choices.map((choice) => ({
					optionGroupId: group.groupId,
					optionChoiceId: choice.id,
					quantity: choice.quantity ?? 1,
				})),
			);

			return {
				itemId: item.itemId,
				quantity: item.quantity,
				options: options.length > 0 ? options : undefined,
			};
		});

		const orderInput = {
			storeId,
			items: orderItems,
			orderType,
			customerName: customerName.trim(),
			customerNotes: customerNotes.trim() || undefined,
		};

		try {
			const order = await createOrderMutation.mutateAsync(orderInput);

			const returnUrl = `${window.location.origin}/${storeSlug}/ordering/return`;

			// Create payment and redirect to hosted payment page
			setIsPaymentRedirecting(true);

			const payment = await createPaymentMutation.mutateAsync({
				orderId: order.id,
				returnUrl,
			});

			if (!payment.checkoutUrl) {
				toast.error("Payment provider did not return payment URL");
				setIsPaymentRedirecting(false);
				return;
			}

			// Clear cart before redirect
			clearCart();
			// Redirect to hosted payment page
			window.location.href = payment.checkoutUrl;
		} catch {
			setIsPaymentRedirecting(false);
			// Error toast handled by mutation
		}
	};

	// Show payment redirect loading state
	if (isPaymentRedirecting) {
		return (
			<div className="min-h-screen bg-background">
				<div className="mx-auto max-w-xl px-4 py-12">
					<ShopCard padding="lg" className="space-y-4 text-center">
						<Loader2 className="mx-auto size-12 animate-spin text-primary" />
						<ShopHeading as="h1" size="lg">
							{t("ordering.payment.redirecting")}
						</ShopHeading>
						<ShopMutedText>{t("ordering.payment.pleaseWait")}</ShopMutedText>
					</ShopCard>
				</div>
			</div>
		);
	}

	const isSubmitting =
		createOrderMutation.isPending || createPaymentMutation.isPending;

	const isFormValid = customerName.trim() && items.length > 0;

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-xl px-4 py-6">
				{/* Header */}
				<ShopHeading as="h1" size="xl" className="mb-6">
					{t("ordering.title")}
				</ShopHeading>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Order Type Selection */}
					<ShopCard padding="md" className="space-y-4">
						<ShopHeading as="h2" size="md">
							{t("ordering.orderType")}
						</ShopHeading>

						<RadioGroup
							value={orderType}
							onValueChange={(value: string) =>
								setOrderType(value as OrderType)
							}
							className="space-y-2"
						>
							<div className="flex items-center space-x-3">
								<RadioGroupItem value="dine_in" id="dine_in" />
								<Label htmlFor="dine_in" className="cursor-pointer">
									{t("ordering.orderTypes.dineIn")}
								</Label>
							</div>
							<div className="flex items-center space-x-3">
								<RadioGroupItem value="takeaway" id="takeaway" />
								<Label htmlFor="takeaway" className="cursor-pointer">
									{t("ordering.orderTypes.takeaway")}
								</Label>
							</div>
							<div className="flex items-center space-x-3">
								<RadioGroupItem value="delivery" id="delivery" />
								<Label htmlFor="delivery" className="cursor-pointer">
									{t("ordering.orderTypes.delivery")}
								</Label>
							</div>
						</RadioGroup>
					</ShopCard>

					{/* Customer Info */}
					<ShopCard padding="md" className="space-y-4">
						<ShopHeading as="h2" size="md">
							{t("ordering.yourInfo")}
						</ShopHeading>

						<div>
							<Label htmlFor="customerName" className="font-medium text-sm">
								{t("ordering.yourName")}
							</Label>
							<Input
								id="customerName"
								type="text"
								value={customerName}
								onChange={(e) => setCustomerName(e.target.value)}
								placeholder={t("ordering.namePlaceholder")}
								className="mt-1 w-full"
								autoComplete="name"
							/>
						</div>

						<div>
							<Label htmlFor="customerNotes" className="font-medium text-sm">
								{t("ordering.specialRequests")}
								<span className="ms-1 font-normal text-muted-foreground">
									({t("ordering.optional")})
								</span>
							</Label>
							<Textarea
								id="customerNotes"
								value={customerNotes}
								onChange={(e) => setCustomerNotes(e.target.value)}
								placeholder={t("ordering.specialRequestsPlaceholder")}
								className="mt-1 min-h-[80px] w-full resize-none"
								maxLength={500}
							/>
						</div>
					</ShopCard>

					{/* Order Summary */}
					<ShopCard padding="md" className="space-y-4">
						<ShopHeading as="h2" size="md">
							{t("ordering.orderSummary")}
						</ShopHeading>

						{/* Cart items */}
						<div className="space-y-3">
							{items.map((item) => (
								<div key={item.id} className="flex justify-between text-sm">
									<div className="flex-1">
										<span className="font-medium">
											{item.quantity}x {item.name}
										</span>
										{item.selectedOptions.length > 0 && (
											<ShopMutedText className="text-xs">
												{item.selectedOptions
													.flatMap((g) => g.choices.map((c) => c.name))
													.join(", ")}
											</ShopMutedText>
										)}
									</div>
									<ShopPrice cents={item.totalPrice} />
								</div>
							))}
						</div>

						{/* Totals */}
						<div className="space-y-2 border-border border-t pt-3">
							<ShopPriceRow
								label={t("ordering.subtotal")}
								cents={subtotal}
								variant="total"
							/>
						</div>
					</ShopCard>

					{/* Submit Button */}
					<ShopButton
						type="submit"
						variant="primary"
						size="lg"
						className="w-full"
						disabled={isSubmitting || !isFormValid}
					>
						{isSubmitting
							? t("ordering.submitting")
							: t("ordering.proceedToPayment")}
					</ShopButton>
				</form>
			</div>
		</div>
	);
}
