"use client";

import { useTranslation } from "react-i18next";
import { ShopHeading, ShopPrice } from "../../shared/components/ui";

interface CartSummaryProps {
	/** Total in cents (prices include VAT) */
	subtotal: number;
}

export function CartSummary({ subtotal }: CartSummaryProps) {
	const { t } = useTranslation("shop");

	return (
		<div className="pt-4 border-t border-border">
			{/* Total row - prices include VAT (European style) */}
			<div className="flex justify-between py-2 text-lg font-medium text-foreground">
				<span>{t("cart.total")}</span>
				<ShopHeading as="span" size="lg">
					<ShopPrice cents={subtotal} size="lg" />
				</ShopHeading>
			</div>
		</div>
	);
}
