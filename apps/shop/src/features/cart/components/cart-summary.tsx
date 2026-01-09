import { useTranslation } from "react-i18next";
import { ShopHeading, ShopPrice } from "../../shared/components/ui";

interface CartSummaryProps {
	/** Total in cents (prices include VAT) */
	subtotal: number;
}

export function CartSummary({ subtotal }: CartSummaryProps) {
	const { t } = useTranslation("shop");

	return (
		<div className="border-border border-t pt-4">
			{/* Total row - prices include VAT (European style) */}
			<div className="flex justify-between py-2 font-medium text-foreground text-lg">
				<span>{t("cart.total")}</span>
				<ShopHeading as="span" size="lg">
					<ShopPrice cents={subtotal} size="lg" />
				</ShopHeading>
			</div>
		</div>
	);
}
