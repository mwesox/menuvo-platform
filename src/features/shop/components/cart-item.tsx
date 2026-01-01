"use client";

import { X } from "lucide-react";
import type { CartItem as CartItemType } from "../cart-context";
import { formatPrice } from "../utils";
import { QuantityStepper } from "./quantity-stepper";

interface CartItemProps {
	item: CartItemType;
	onQuantityChange: (quantity: number) => void;
	onRemove: () => void;
}

export function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
	// Format selected options as comma-separated list
	const optionsText = item.selectedOptions
		.flatMap((group) => group.choices.map((choice) => choice.name))
		.join(", ");

	return (
		<div className="flex gap-3 py-4 border-b border-shop-border-subtle">
			{/* Item image */}
			<div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 flex-shrink-0 overflow-hidden">
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
						<h3
							style={{ fontFamily: "var(--font-heading)" }}
							className="text-shop-foreground font-normal truncate"
						>
							{item.name}
						</h3>
						{optionsText && (
							<p className="text-sm text-shop-foreground-muted truncate">
								{optionsText}
							</p>
						)}
					</div>
					<button
						type="button"
						onClick={onRemove}
						className="p-1.5 text-shop-foreground-muted hover:text-shop-foreground transition-colors flex-shrink-0"
						aria-label={`Remove ${item.name} from cart`}
					>
						<X className="w-4 h-4" />
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
					<span className="font-medium text-shop-foreground">
						{formatPrice(item.totalPrice)}
					</span>
				</div>
			</div>
		</div>
	);
}
