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

interface PayPalPaymentProps {
	orderId: string;
	storeSlug: string;
}

/**
 * PayPal payment component.
 * Handles redirect-based payment where customer is sent to PayPal hosted page.
 *
 * Flow:
 * 1. Customer clicks "Pay Now" button
 * 2. Create PayPal order via server function
 * 3. Redirect to PayPal approval page
 * 4. Customer completes payment on PayPal
 * 5. Customer redirects back to return URL
 * 6. Webhook updates order status
 */
export function PayPalPayment({ orderId, storeSlug }: PayPalPaymentProps) {
	const { t } = useTranslation("shop");
	const createPayment = useCreatePayment();

	const handlePayNow = async () => {
		const baseUrl = window.location.origin;
		const returnUrl = `${baseUrl}/${storeSlug}/ordering/return`;
		const cancelUrl = `${baseUrl}/${storeSlug}/ordering/cancel`;

		const result = await createPayment.mutateAsync({
			orderId,
			returnUrl,
			cancelUrl,
		});

		if (result.approvalUrl) {
			// Redirect to PayPal approval page
			window.location.href = result.approvalUrl;
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
							<PaymentMethodIcon name="PayPal" />
							<PaymentMethodIcon name="Card" />
							<PaymentMethodIcon name="Pay Later" />
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
 * Shows available PayPal payment methods.
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
