"use client";

import { formatPrice } from "../utils";

interface CartSummaryProps {
	/** Subtotal in cents */
	subtotal: number;
}

export function CartSummary({ subtotal }: CartSummaryProps) {
	return (
		<div className="space-y-2 pt-4 border-t border-shop-border">
			{/* Subtotal row */}
			<div className="flex justify-between py-2 text-shop-foreground">
				<span className="text-shop-foreground-muted">Subtotal</span>
				<span>{formatPrice(subtotal)}</span>
			</div>

			{/* Tax row */}
			<div className="flex justify-between py-2 text-shop-foreground">
				<span className="text-shop-foreground-muted">Tax</span>
				<span className="text-shop-foreground-muted">
					Calculated at checkout
				</span>
			</div>

			{/* Divider */}
			<div className="border-t border-shop-border" />

			{/* Total row */}
			<div className="flex justify-between py-2 text-lg font-medium text-shop-foreground">
				<span>Total</span>
				<span style={{ fontFamily: "var(--font-heading)" }}>
					{formatPrice(subtotal)}
				</span>
			</div>
		</div>
	);
}
