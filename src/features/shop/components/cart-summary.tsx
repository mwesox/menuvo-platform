"use client";

import { ShopDivider, ShopHeading, ShopPrice, ShopPriceRow } from "./ui";

interface CartSummaryProps {
	/** Subtotal in cents */
	subtotal: number;
}

export function CartSummary({ subtotal }: CartSummaryProps) {
	return (
		<div className="space-y-2 pt-4 border-t border-border">
			{/* Subtotal row */}
			<ShopPriceRow label="Subtotal" cents={subtotal} />

			{/* Tax row */}
			<div className="flex justify-between py-2 text-foreground">
				<span className="text-muted-foreground">Tax</span>
				<span className="text-muted-foreground">Calculated at checkout</span>
			</div>

			{/* Divider */}
			<ShopDivider />

			{/* Total row */}
			<div className="flex justify-between py-2 text-lg font-medium text-foreground">
				<span>Total</span>
				<ShopHeading as="span" size="lg">
					<ShopPrice cents={subtotal} size="lg" />
				</ShopHeading>
			</div>
		</div>
	);
}
