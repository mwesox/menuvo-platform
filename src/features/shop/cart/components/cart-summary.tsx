"use client";

import { useTranslation } from "react-i18next";
import {
	ShopDivider,
	ShopHeading,
	ShopPrice,
	ShopPriceRow,
} from "../../shared/components/ui";

interface CartSummaryProps {
	/** Subtotal in cents */
	subtotal: number;
}

export function CartSummary({ subtotal }: CartSummaryProps) {
	const { t } = useTranslation("shop");

	return (
		<div className="space-y-2 pt-4 border-t border-border">
			{/* Subtotal row */}
			<ShopPriceRow label={t("cart.subtotal")} cents={subtotal} />

			{/* Tax row */}
			<div className="flex justify-between py-2 text-foreground">
				<span className="text-muted-foreground">{t("cart.tax")}</span>
				<span className="text-muted-foreground">
					{t("cart.taxCalculatedAtCheckout")}
				</span>
			</div>

			{/* Divider */}
			<ShopDivider />

			{/* Total row */}
			<div className="flex justify-between py-2 text-lg font-medium text-foreground">
				<span>{t("cart.total")}</span>
				<ShopHeading as="span" size="lg">
					<ShopPrice cents={subtotal} size="lg" />
				</ShopHeading>
			</div>
		</div>
	);
}
