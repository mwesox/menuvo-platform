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
		<div className="flex items-center gap-3 border-border/50 border-b py-4">
			{/* Item image - centered vertically */}
			<div className="size-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
				{item.imageUrl && (
					<img
						src={item.imageUrl}
						alt={item.name}
						className="h-full w-full object-cover"
					/>
				)}
			</div>

			{/* Item details - name and quantity */}
			<div className="min-w-0 flex-1">
				<ShopHeading as="h3" size="sm" className="truncate font-normal">
					{item.name}
				</ShopHeading>
				{optionsText && (
					<ShopMutedText className="truncate text-sm">
						{optionsText}
					</ShopMutedText>
				)}
				<div className="mt-1.5">
					<QuantityStepper
						value={item.quantity}
						onChange={onQuantityChange}
						min={1}
						max={99}
						size="sm"
					/>
				</div>
			</div>

			{/* Price and remove - right aligned */}
			<div className="flex flex-col items-end justify-between self-stretch">
				<button
					type="button"
					onClick={onRemove}
					className="-m-1 p-1 text-muted-foreground transition-colors hover:text-foreground"
					aria-label={t("cart.removeItem", { name: item.name })}
				>
					<X className="size-4" />
				</button>
				<ShopPrice cents={item.totalPrice} className="font-medium" />
			</div>
		</div>
	);
}
