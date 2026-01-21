import { Box, Center, Spinner, Text, VStack } from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
	ShopCard,
	ShopHeading,
	ShopMutedText,
} from "../../shared/components/ui";
import { useVerifyPayment } from "../queries";

type RouterOutput = inferRouterOutputs<AppRouter>;
type PaymentStatus = RouterOutput["order"]["verifyPayment"];

interface OrderingReturnPageProps {
	storeSlug: string;
}

/**
 * Handles post-payment redirect from Mollie.
 *
 * For synchronous payment methods (credit cards, PayPal), the status is immediately
 * final when the user returns from Mollie - no polling needed.
 *
 * The backend verifies payment status with Mollie API and updates the order.
 * We only pass orderId - backend handles looking up the payment ID internally.
 */
export function OrderingReturnPage({ storeSlug }: OrderingReturnPageProps) {
	const { t } = useTranslation("shop");
	const navigate = useNavigate();
	const search = useSearch({ from: "/$slug/ordering/return" });

	// Order ID from query params (passed in return URL)
	const orderId = search.order_id ?? null;

	// Verify payment status - backend checks Mollie API and updates order
	const { data, isLoading, isError } = useVerifyPayment(orderId);
	const paymentData = data as PaymentStatus | undefined;

	// Redirect to order confirmation when payment is confirmed
	useEffect(() => {
		if (paymentData?.paymentStatus === "paid" && orderId) {
			navigate({
				to: "/$slug/order/$orderId",
				params: { slug: storeSlug, orderId },
			});
		}
	}, [data, orderId, storeSlug, navigate]);

	// Show loading state during verification
	if (isLoading) {
		return (
			<Box minH="100vh" bg="bg">
				<Box maxW="lg" mx="auto" px="4" py="12">
					<ShopCard padding="lg">
						<VStack gap="4" textAlign="center">
							<Spinner size="xl" color="teal.solid" />
							<ShopHeading as="h1" size="lg">
								{t("ordering.return.verifying")}
							</ShopHeading>
							<ShopMutedText>{t("ordering.return.pleaseWait")}</ShopMutedText>
						</VStack>
					</ShopCard>
				</Box>
			</Box>
		);
	}

	// Show error state for any non-paid status or query error
	const errorMessage = isError
		? t("ordering.return.tryAgain")
		: paymentData?.paymentStatus === "expired"
			? t("ordering.return.sessionExpired")
			: t("ordering.return.tryAgain");

	return (
		<Box minH="100vh" bg="bg">
			<Box maxW="lg" mx="auto" px="4" py="12">
				<ShopCard padding="lg">
					<VStack gap="4" textAlign="center">
						<Center boxSize="12" rounded="full" bg="red.subtle">
							<Text textStyle="2xl" color="red.fg">
								!
							</Text>
						</Center>
						<ShopHeading as="h1" size="lg">
							{t("ordering.return.paymentFailed")}
						</ShopHeading>
						<ShopMutedText>{errorMessage}</ShopMutedText>
					</VStack>
				</ShopCard>
			</Box>
		</Box>
	);
}
