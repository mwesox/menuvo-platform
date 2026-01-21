import { Box, Center, Spinner, Stack, VStack } from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { useTranslation } from "react-i18next";
import { LuCircleCheck } from "react-icons/lu";
import { useTRPC } from "../../../lib/trpc";
import {
	ShopButton,
	ShopCard,
	ShopHeading,
	ShopMutedText,
} from "../../shared/components/ui";
import { formatDateTime } from "../../shared/utils/date-formatting";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Order = RouterOutput["order"]["getById"];

interface OrderConfirmationPageProps {
	orderId: string;
	storeSlug: string;
}

export function OrderConfirmationPage({
	orderId,
	storeSlug,
}: OrderConfirmationPageProps) {
	const { t } = useTranslation("shop");
	const trpc = useTRPC();

	// Fetch order to get pickup number
	const { data: order, isLoading } = useQuery({
		...trpc.order.getById.queryOptions({ orderId }),
		staleTime: 30_000,
		refetchInterval: 15_000,
	});

	// Format pickup number with leading zeros
	const pickupNumber = (order as Order | undefined)?.pickupNumber ?? 0;
	const formattedPickupNumber = String(pickupNumber).padStart(3, "0");

	return (
		<Box minH="100vh" bg="bg">
			<Box maxW="lg" mx="auto" px="4" py="16">
				<ShopCard padding="lg">
					<VStack gap="6" textAlign="center">
						{/* Success Icon */}
						<Center>
							<Center boxSize="16" rounded="full" bg="green.subtle">
								<Box as={LuCircleCheck} boxSize="8" color="green.fg" />
							</Center>
						</Center>

						{/* Title */}
						<Stack gap="2">
							<ShopHeading as="h1" size="xl">
								{t("confirmation.title")}
							</ShopHeading>
							<ShopMutedText>{t("confirmation.subtitle")}</ShopMutedText>
						</Stack>

						{/* Pickup Number */}
						<Box rounded="lg" bg="bg.muted" py="6" w="full">
							<ShopMutedText textStyle="sm">
								{t("confirmation.orderNumber")}
							</ShopMutedText>
							{isLoading ? (
								<Spinner size="lg" mt="2" color="fg.muted" />
							) : (
								<ShopHeading
									as="p"
									size="2xl"
									textStyle="4xl"
									fontVariantNumeric="tabular-nums"
								>
									#{formattedPickupNumber}
								</ShopHeading>
							)}
						</Box>

						{/* Scheduled Pickup Time */}
						{order?.scheduledPickupTime && (
							<Box rounded="lg" bg="bg.muted" py="4" w="full">
								<ShopMutedText textStyle="sm">
									{t("confirmation.scheduledPickup")}
								</ShopMutedText>
								<ShopHeading as="p" size="md" mt="1">
									{formatDateTime(order.scheduledPickupTime)}
								</ShopHeading>
							</Box>
						)}

						{/* Instructions */}
						<ShopMutedText textStyle="sm">
							{t("confirmation.instructions")}
						</ShopMutedText>

						{/* Back to Menu */}
						<Link to="/$slug" params={{ slug: storeSlug }}>
							<ShopButton variant="primary" size="lg" w="full">
								{t("confirmation.backToMenu")}
							</ShopButton>
						</Link>
					</VStack>
				</ShopCard>
			</Box>
		</Box>
	);
}
