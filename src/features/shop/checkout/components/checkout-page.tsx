"use client";

import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { OrderType } from "@/features/orders/constants";
import { useCreateOrder } from "@/features/orders/queries";
import { type CartItem, useCartStore } from "../../cart/stores/cart-store";
import {
	ShopButton,
	ShopCard,
	ShopHeading,
	ShopMutedText,
	ShopPrice,
	ShopPriceRow,
} from "../../shared/components/ui";

interface CheckoutPageProps {
	storeId: number;
	storeSlug: string;
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

export function CheckoutPage({ storeId, storeSlug }: CheckoutPageProps) {
	const { t } = useTranslation("shop");
	const navigate = useNavigate();

	// Cart state - compute subtotal from items (getters don't work with persist)
	const items = useCartStore((s) => s.items);
	const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
	const clearCart = useCartStore((s) => s.clearCart);

	// Form state
	const [customerName, setCustomerName] = useState("");
	const [orderType, setOrderType] = useState<OrderType>("dine_in");

	// Mutation
	const createOrderMutation = useCreateOrder(storeId);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!customerName.trim()) {
			toast.error(t("checkout.nameRequired"));
			return;
		}

		if (items.length === 0) {
			toast.error(t("checkout.cartEmpty"));
			return;
		}

		// Validate cart items have required fields (catches corrupted localStorage)
		const invalidItems = items.filter(
			(item) => !item.name || typeof item.name !== "string",
		);
		if (invalidItems.length > 0) {
			toast.error(t("checkout.invalidCartItems"));
			clearCart();
			return;
		}

		// Transform cart items to order format
		const orderItems = items.map(transformCartItemToSnapshot);

		const orderData = {
			storeId,
			items: orderItems,
			orderType,
			customerName: customerName.trim(),
			paymentMethod: "pay_at_counter",
			subtotal,
			taxAmount: 0,
			tipAmount: 0,
			totalAmount: subtotal,
		};

		try {
			const order = await createOrderMutation.mutateAsync({
				data: orderData,
			});

			// Clear cart and redirect to confirmation
			clearCart();
			navigate({
				to: "/shop/$slug/order/$orderId",
				params: { slug: storeSlug, orderId: String(order.id) },
			});
		} catch {
			// Error toast handled by mutation
		}
	};

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

					{/* Customer Name */}
					<ShopCard padding="md" className="space-y-3">
						<Label htmlFor="customerName">
							<ShopHeading as="span" size="md">
								{t("checkout.yourName")}
							</ShopHeading>
						</Label>
						<Input
							id="customerName"
							type="text"
							value={customerName}
							onChange={(e) => setCustomerName(e.target.value)}
							placeholder={t("checkout.namePlaceholder")}
							className="w-full"
							autoComplete="name"
						/>
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
						disabled={
							createOrderMutation.isPending ||
							items.length === 0 ||
							!customerName.trim()
						}
					>
						{createOrderMutation.isPending
							? t("checkout.submitting")
							: t("checkout.placeOrder")}
					</ShopButton>
				</form>
			</div>
		</div>
	);
}
