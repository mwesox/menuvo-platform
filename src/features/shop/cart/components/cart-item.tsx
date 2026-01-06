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
		<div className="flex gap-3 border-border/50 border-b py-4">
			{/* Item image - responsive sizing */}
			<div className="size-12 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 sm:size-14">
				{item.imageUrl && (
					<img
						src={item.imageUrl}
						alt={item.name}
						className="h-full w-full object-cover"
					/>
				)}
			</div>

			{/* Item details */}
			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0">
						<ShopHeading as="h3" size="sm" className="truncate font-normal">
							{item.name}
						</ShopHeading>
						{optionsText && (
							<ShopMutedText className="truncate text-sm">
								{optionsText}
							</ShopMutedText>
						)}
					</div>
					<button
						type="button"
						onClick={onRemove}
						className="flex-shrink-0 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
						aria-label={t("cart.removeItem", { name: item.name })}
					>
						<X className="size-4" />
					</button>
				</div>

				{/* Quantity and price row */}
				<div className="mt-2 flex items-center justify-between">
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
