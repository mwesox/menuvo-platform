"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PaymentCapabilitiesStatus } from "@/db/schema";
import type { OrderType } from "@/features/orders/constants";
import { useCreateOrder } from "@/features/orders/queries";
import { computeMerchantCapabilities } from "@/lib/capabilities";
import { type CartItem, useCartStore } from "../../cart/stores/cart-store";
import { StoreUnavailable } from "../../shared/components/store-unavailable";
import {
	ShopButton,
	ShopCard,
	ShopHeading,
	ShopMutedText,
	ShopPrice,
	ShopPriceRow,
} from "../../shared/components/ui";
import { useCreateCheckoutSession } from "../queries";
import { EmbeddedCheckoutWrapper } from "./embedded-checkout";

interface CheckoutPageProps {
	storeId: number;
	storeSlug: string;
	merchant: {
		paymentCapabilitiesStatus: PaymentCapabilitiesStatus | null;
	} | null;
}

/**
 * Transform cart item options to order snapshot format.
 * Cart uses grouped structure, order snapshot uses flat structure.
 */
function transformCartItemToSnapshot(cartItem: CartItem) {
	// Flatten the grouped options structure
	const options = cartItem.selectedOptions.flatMap((group) =>
		group.choices.map((choice) => ({
			optionGroupId: group.groupId,
			optionChoiceId: choice.id,
			groupName: group.groupName,
			choiceName: choice.name,
			quantity: 1,
			priceModifier: choice.price,
		})),
	);

	// Calculate options price
	const optionsPrice = options.reduce(
		(sum, opt) => sum + opt.priceModifier * opt.quantity,
		0,
	);
	const totalPrice = (cartItem.basePrice + optionsPrice) * cartItem.quantity;

	return {
		itemId: cartItem.itemId,
		name: cartItem.name,
		description: undefined,
		quantity: cartItem.quantity,
		unitPrice: cartItem.basePrice,
		optionsPrice,
		totalPrice,
		options,
	};
}

export function CheckoutPage({
	storeId,
	storeSlug,
	merchant,
}: CheckoutPageProps) {
	const { t } = useTranslation("shop");

	// Cart state - compute subtotal from items (getters don't work with persist)
	const items = useCartStore((s) => s.items);
	const clearCart = useCartStore((s) => s.clearCart);

	// Form state
	const [customerName, setCustomerName] = useState("");
	const [customerEmail, setCustomerEmail] = useState("");
	const [orderType, setOrderType] = useState<OrderType>("dine_in");

	// Checkout session state (for embedded checkout)
	const [checkoutSession, setCheckoutSession] = useState<{
		clientSecret: string;
		merchantAccountId: string | null;
		orderId: number;
	} | null>(null);

	// Mutations
	const createOrderMutation = useCreateOrder(storeId);
	const createCheckoutSessionMutation = useCreateCheckoutSession();

	// Check if merchant can accept online payments
	const merchantCaps = computeMerchantCapabilities({
		paymentCapabilitiesStatus: merchant?.paymentCapabilitiesStatus ?? null,
	});

	// Show unavailable message if payment capabilities are not active
	if (!merchantCaps.canAcceptOnlinePayment) {
		return <StoreUnavailable backUrl={`/shop/${storeSlug}`} />;
	}

	// Compute subtotal from items
	const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

	const validateForm = (): boolean => {
		if (!customerName.trim()) {
			toast.error(t("checkout.nameRequired"));
			return false;
		}

		if (!customerEmail.trim()) {
			toast.error(t("checkout.emailRequired"));
			return false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(customerEmail)) {
			toast.error(t("checkout.invalidEmail"));
			return false;
		}

		if (items.length === 0) {
			toast.error(t("checkout.cartEmpty"));
			return false;
		}

		// Validate cart items have required fields (catches corrupted localStorage)
		const invalidItems = items.filter(
			(item) => !item.name || typeof item.name !== "string",
		);
		if (invalidItems.length > 0) {
			toast.error(t("checkout.invalidCartItems"));
			clearCart();
			return false;
		}

		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		// Transform cart items to order format
		const orderItems = items.map(transformCartItemToSnapshot);

		const orderData = {
			storeId,
			items: orderItems,
			orderType,
			customerName: customerName.trim(),
			customerEmail: customerEmail.trim(),
			paymentMethod: "stripe" as const,
			subtotal,
			taxAmount: 0,
			tipAmount: 0,
			totalAmount: subtotal,
		};

		try {
			const order = await createOrderMutation.mutateAsync({
				data: orderData,
			});

			// Create checkout session for online payment
			const returnUrl = `${window.location.origin}/shop/${storeSlug}/checkout/return`;

			const session = await createCheckoutSessionMutation.mutateAsync({
				data: {
					orderId: order.id,
					returnUrl,
				},
			});

			if (session.clientSecret) {
				// Clear cart before showing checkout (order is already created)
				clearCart();
				setCheckoutSession({
					clientSecret: session.clientSecret,
					merchantAccountId: session.merchantAccountId,
					orderId: order.id,
				});
			}
		} catch {
			// Error toast handled by mutation
		}
	};

	// Show embedded checkout if session is created
	if (checkoutSession) {
		return (
			<div className="min-h-screen bg-background">
				<div className="max-w-lg mx-auto px-4 py-6">
					<ShopHeading as="h1" size="xl" className="mb-6">
						{t("checkout.payment")}
					</ShopHeading>
					<EmbeddedCheckoutWrapper
						clientSecret={checkoutSession.clientSecret}
						merchantAccountId={checkoutSession.merchantAccountId}
					/>
				</div>
			</div>
		);
	}

	const isSubmitting =
		createOrderMutation.isPending || createCheckoutSessionMutation.isPending;

	const isFormValid =
		customerName.trim() && customerEmail.trim() && items.length > 0;

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-lg mx-auto px-4 py-6">
				{/* Header */}
				<ShopHeading as="h1" size="xl" className="mb-6">
					{t("checkout.title")}
				</ShopHeading>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Order Type Selection */}
					<ShopCard padding="md" className="space-y-4">
						<ShopHeading as="h2" size="md">
							{t("checkout.orderType")}
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
									{t("checkout.orderTypes.dineIn")}
								</Label>
							</div>
							<div className="flex items-center space-x-3">
								<RadioGroupItem value="takeaway" id="takeaway" />
								<Label htmlFor="takeaway" className="cursor-pointer">
									{t("checkout.orderTypes.takeaway")}
								</Label>
							</div>
							<div className="flex items-center space-x-3">
								<RadioGroupItem value="delivery" id="delivery" />
								<Label htmlFor="delivery" className="cursor-pointer">
									{t("checkout.orderTypes.delivery")}
								</Label>
							</div>
						</RadioGroup>
					</ShopCard>

					{/* Customer Info */}
					<ShopCard padding="md" className="space-y-4">
						<ShopHeading as="h2" size="md">
							{t("checkout.yourInfo")}
						</ShopHeading>

						<div className="space-y-3">
							<div>
								<Label htmlFor="customerName" className="text-sm font-medium">
									{t("checkout.yourName")}
								</Label>
								<Input
									id="customerName"
									type="text"
									value={customerName}
									onChange={(e) => setCustomerName(e.target.value)}
									placeholder={t("checkout.namePlaceholder")}
									className="mt-1 w-full"
									autoComplete="name"
								/>
							</div>

							{/* Email field - required for payment */}
							<div>
								<Label htmlFor="customerEmail" className="text-sm font-medium">
									{t("checkout.yourEmail")}
									<span className="text-destructive ml-1">*</span>
								</Label>
								<Input
									id="customerEmail"
									type="email"
									value={customerEmail}
									onChange={(e) => setCustomerEmail(e.target.value)}
									placeholder={t("checkout.emailPlaceholder")}
									className="mt-1 w-full"
									autoComplete="email"
								/>
								<ShopMutedText className="text-xs mt-1">
									{t("checkout.emailRequiredForOnline")}
								</ShopMutedText>
							</div>
						</div>
					</ShopCard>

					{/* Order Summary */}
					<ShopCard padding="md" className="space-y-4">
						<ShopHeading as="h2" size="md">
							{t("checkout.orderSummary")}
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
						<div className="pt-3 border-t border-border space-y-2">
							<ShopPriceRow
								label={t("checkout.subtotal")}
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
							? t("checkout.submitting")
							: t("checkout.proceedToPayment")}
					</ShopButton>
				</form>
			</div>
		</div>
	);
}
