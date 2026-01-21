import { Box, Flex, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { ShopHeading, ShopPrice } from "../../shared/components/ui";

interface CartSummaryProps {
	/** Total in cents (prices include VAT) */
	subtotal: number;
}

export function CartSummary({ subtotal }: CartSummaryProps) {
	const { t } = useTranslation("shop");

	return (
		<Box borderTopWidth="1px" borderColor="border" pt="4" w="full">
			{/* Total row - prices include VAT (European style) */}
			<Flex
				justify="space-between"
				py="2"
				fontWeight="medium"
				color="fg"
				textStyle="lg"
			>
				<Text as="span">{t("cart.total")}</Text>
				<ShopHeading as="span" size="lg">
					<ShopPrice cents={subtotal} size="lg" />
				</ShopHeading>
			</Flex>
		</Box>
	);
}
