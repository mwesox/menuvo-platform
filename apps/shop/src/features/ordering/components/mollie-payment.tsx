import {
	Box,
	Center,
	Flex,
	Spinner,
	Stack,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { ShopButton, ShopCard, ShopHeading } from "../../shared/components/ui";
import { useCreatePayment } from "../queries";

interface MolliePaymentProps {
	orderId: string;
	storeSlug: string;
}

/**
 * Mollie payment component.
 * Handles redirect-based payment where customer is sent to Mollie hosted page.
 *
 * Flow:
 * 1. Customer clicks "Pay Now" button
 * 2. Create Mollie payment via server function
 * 3. Redirect to Mollie hosted payment page
 * 4. Customer completes payment on Mollie
 * 5. Customer redirects back to return URL
 * 6. Webhook updates order status
 */
export function MolliePayment({ orderId, storeSlug }: MolliePaymentProps) {
	const { t } = useTranslation("shop");
	const createPayment = useCreatePayment();

	const handlePayNow = async () => {
		const returnUrl = `${window.location.origin}/${storeSlug}/ordering/return`;

		const result = await createPayment.mutateAsync({
			orderId,
			returnUrl,
		});

		if (result.checkoutUrl) {
			// Redirect to Mollie hosted payment page
			window.location.href = result.checkoutUrl;
		}
	};

	return (
		<Box minH="100vh" bg="bg">
			<Box maxW="lg" mx="auto" px="4" py="6">
				<ShopHeading as="h1" size="xl" mb="6">
					{t("ordering.payment")}
				</ShopHeading>

				<ShopCard padding="lg">
					<Stack gap="6">
						<VStack gap="3" textAlign="center">
							<ShopHeading as="h2" size="md">
								{t("ordering.payment.title")}
							</ShopHeading>
							<Text color="fg.muted" textStyle="sm">
								{t("ordering.payment.description")}
							</Text>
						</VStack>

						{/* Payment method icons */}
						<Flex justify="center" gap="4" py="4">
							<PaymentMethodIcon name="iDEAL" />
							<PaymentMethodIcon name="Card" />
							<PaymentMethodIcon name="PayPal" />
							<PaymentMethodIcon name="Bancontact" />
						</Flex>

						{createPayment.isError && (
							<Box
								rounded="md"
								bg="red.subtle"
								p="3"
								textAlign="center"
								textStyle="sm"
								color="red.fg"
							>
								{t("ordering.payment.error")}
							</Box>
						)}

						<ShopButton
							variant="primary"
							size="lg"
							w="full"
							onClick={handlePayNow}
							disabled={createPayment.isPending}
						>
							{createPayment.isPending ? (
								<>
									<Spinner size="sm" me="2" />
									{t("ordering.payment.redirecting")}
								</>
							) : (
								t("ordering.payment.payNow")
							)}
						</ShopButton>

						<Text textAlign="center" color="fg.muted" textStyle="xs">
							{t("ordering.payment.securePayment")}
						</Text>
					</Stack>
				</ShopCard>
			</Box>
		</Box>
	);
}

/**
 * Payment method icon placeholder.
 * In production, use actual payment method logos from Mollie.
 */
function PaymentMethodIcon({ name }: { name: string }) {
	return (
		<VStack gap="1">
			<Center
				h="8"
				w="12"
				rounded="sm"
				borderWidth="1px"
				borderColor="border"
				bg="bg.muted"
			>
				<Text fontWeight="medium" textStyle="2xs" color="fg.muted">
					{name}
				</Text>
			</Center>
		</VStack>
	);
}
