"use client";

import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	QuantityStepper,
	ShopHeading,
	ShopMutedText,
	ShopPrice,
} from "../../shared";
import type { CartItem as CartItemType } from "../stores/cart-store";

interface CartItemProps {
	item: CartItemType;
	onQuantityChange: (quantity: number) => void;
	onRemove: () => void;
}

export function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
	const { t } = useTranslation("shop");
	// Format selected options as comma-separated list
	const optionsText = item.selectedOptions
		.flatMap((group) => group.choices.map((choice) => choice.name))
		.join(", ");

	return (
		<div className="flex gap-3 py-4 border-b border-border/50">
			{/* Item image - responsive sizing */}
			<div className="size-12 sm:size-14 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 flex-shrink-0 overflow-hidden">
				{item.imageUrl && (
					<img
						src={item.imageUrl}
						alt={item.name}
						className="w-full h-full object-cover"
					/>
				)}
			</div>

			{/* Item details */}
			<div className="flex-1 min-w-0">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<ShopHeading as="h3" size="sm" className="font-normal truncate">
							{item.name}
						</ShopHeading>
						{optionsText && (
							<ShopMutedText className="text-sm truncate">
								{optionsText}
							</ShopMutedText>
						)}
					</div>
					<button
						type="button"
						onClick={onRemove}
						className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
						aria-label={t("cart.removeItem", { name: item.name })}
					>
						<X className="size-4" />
					</button>
				</div>

				{/* Quantity and price row */}
				<div className="flex items-center justify-between mt-2">
					<QuantityStepper
						value={item.quantity}
						onChange={onQuantityChange}
						min={1}
						max={99}
						size="sm"
					/>
					<ShopPrice cents={item.totalPrice} className="font-medium" />
				</div>
			</div>
		</div>
	);
}
