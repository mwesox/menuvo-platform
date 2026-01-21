import {
	Badge,
	Box,
	Flex,
	Heading,
	HStack,
	Separator,
	Skeleton,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import type { OrderStatus, OrderType } from "@/features/orders";
import { formatPrice } from "@/features/orders/logic/order-pricing";
import type { OrderDetail as OrderDetailType } from "@/features/orders/types";
import { useTRPC } from "@/lib/trpc";

interface OrderDetailProps {
	orderId: string;
}

const statusVariants: Record<OrderStatus, "outline" | "solid" | "subtle"> = {
	awaiting_payment: "outline",
	confirmed: "solid",
	preparing: "subtle",
	ready: "solid",
	completed: "subtle",
	cancelled: "solid",
};

const statusColorPalettes: Record<OrderStatus, string> = {
	awaiting_payment: "gray",
	confirmed: "blue",
	preparing: "blue",
	ready: "green",
	completed: "gray",
	cancelled: "red",
};

const orderTypeVariants: Record<OrderType, "outline" | "solid" | "subtle"> = {
	dine_in: "outline",
	takeaway: "subtle",
	delivery: "solid",
};

const orderTypeColorPalettes: Record<OrderType, string> = {
	dine_in: "gray",
	takeaway: "blue",
	delivery: "green",
};

export function OrderDetail({ orderId }: OrderDetailProps) {
	const { t, i18n } = useTranslation("console-orders");
	const locale = i18n.language === "de" ? de : enUS;
	const trpc = useTRPC();

	const { data, isLoading, error } = useQuery(
		trpc.order.getById.queryOptions({ orderId }),
	);
	const order = data as OrderDetailType | undefined;

	if (isLoading) {
		return <OrderDetailSkeleton />;
	}

	if (error) {
		return (
			<Flex h="full" align="center" justify="center">
				<Text color="destructive">Error loading order: {error.message}</Text>
			</Flex>
		);
	}

	if (!order) {
		return (
			<Flex h="full" align="center" justify="center">
				<Text color="fg.muted">Order not found</Text>
			</Flex>
		);
	}

	const timeAgo = (date: Date | string | null) => {
		if (!date) return null;
		return formatDistanceToNow(new Date(date), { addSuffix: true, locale });
	};

	return (
		<VStack gap="4" align="stretch">
			{/* Header */}
			<Flex align="center" justify="space-between">
				<Heading size="lg" fontWeight="semibold">
					{t("orderNumber", { id: order.id })}
				</Heading>
				<HStack gap="2">
					<Badge
						variant={orderTypeVariants[order.orderType]}
						colorPalette={orderTypeColorPalettes[order.orderType]}
						size="xs"
					>
						{t(`orderType.${order.orderType}`)}
					</Badge>
					<Badge
						variant={statusVariants[order.status] ?? "solid"}
						colorPalette={statusColorPalettes[order.status] ?? "gray"}
						size="xs"
					>
						{t(`status.${order.status}`)}
					</Badge>
				</HStack>
			</Flex>

			{/* Customer Section */}
			<VStack gap="1" align="stretch" borderTopWidth="1px" pt="4">
				{order.customerName && (
					<Flex justify="space-between" textStyle="sm">
						<Text color="fg.muted">{t("fields.name")}</Text>
						<Text>{order.customerName}</Text>
					</Flex>
				)}
				{order.customerEmail && (
					<Flex justify="space-between" textStyle="sm">
						<Text color="fg.muted">{t("fields.email")}</Text>
						<Text ms="4" truncate>
							{order.customerEmail}
						</Text>
					</Flex>
				)}
				{order.customerPhone && (
					<Flex justify="space-between" textStyle="sm">
						<Text color="fg.muted">{t("fields.phone")}</Text>
						<Text>{order.customerPhone}</Text>
					</Flex>
				)}
				{order.servicePoint && (
					<Flex justify="space-between" textStyle="sm">
						<Text color="fg.muted">{t("fields.servicePoint")}</Text>
						<Text>{order.servicePoint.name}</Text>
					</Flex>
				)}
				{order.customerNotes && (
					<Box pt="1">
						<Text color="fg.muted" textStyle="xs">
							{t("fields.notes")}:
						</Text>
						<Text mt="0.5" textStyle="sm">
							{order.customerNotes}
						</Text>
					</Box>
				)}
			</VStack>

			{/* Items Section */}
			<VStack gap="2" align="stretch" borderTopWidth="1px" pt="4">
				{order.items.map((item) => (
					<VStack key={item.id} gap="0.5" align="stretch">
						<Flex justify="space-between" textStyle="sm">
							<Text>
								{item.quantity}x {item.name}
							</Text>
							<Text fontWeight="medium">{formatPrice(item.totalPrice)}</Text>
						</Flex>
						{item.options.length > 0 && (
							<VStack gap="0.5" align="stretch" ps="4">
								{item.options.map((option) => (
									<Flex
										key={option.id}
										justify="space-between"
										color="fg.muted"
										textStyle="xs"
									>
										<Text>
											{option.quantity > 1 ? `${option.quantity}x ` : ""}
											{option.choiceName}
										</Text>
										{option.priceModifier > 0 && (
											<Text>
												+{formatPrice(option.priceModifier * option.quantity)}
											</Text>
										)}
									</Flex>
								))}
							</VStack>
						)}
					</VStack>
				))}
			</VStack>

			{/* Payment Summary */}
			<VStack gap="3" align="stretch" borderTopWidth="1px" pt="4">
				<VStack gap="1" align="stretch" rounded="lg" bg="bg.muted/50" p="3">
					<Flex justify="space-between" textStyle="sm">
						<Text color="fg.muted">{t("fields.subtotal")}</Text>
						<Text>{formatPrice(order.subtotal)}</Text>
					</Flex>
					{order.taxAmount > 0 && (
						<Flex justify="space-between" textStyle="sm">
							<Text color="fg.muted">{t("fields.tax")}</Text>
							<Text>{formatPrice(order.taxAmount)}</Text>
						</Flex>
					)}
					{order.tipAmount > 0 && (
						<Flex justify="space-between" textStyle="sm">
							<Text color="fg.muted">{t("fields.tip")}</Text>
							<Text>{formatPrice(order.tipAmount)}</Text>
						</Flex>
					)}
					<Separator borderColor="border/50" />
					<Flex justify="space-between" fontWeight="medium">
						<Text>{t("fields.total")}</Text>
						<Text>{formatPrice(order.totalAmount)}</Text>
					</Flex>
				</VStack>
				<Text color="fg.muted" textStyle="xs">
					{t(`paymentStatus.${order.paymentStatus}`)}
					{order.paymentMethod && (
						<Text as="span" textTransform="capitalize">
							{" "}
							via {order.paymentMethod}
						</Text>
					)}
				</Text>
			</VStack>

			{/* Timeline Footer */}
			<Text borderTopWidth="1px" pt="3" color="fg.muted" textStyle="xs">
				{t("fields.created")} {timeAgo(order.createdAt)}
				{order.confirmedAt && (
					<Text as="span">
						{" "}
						&bull; {t("fields.confirmed")} {timeAgo(order.confirmedAt)}
					</Text>
				)}
				{order.completedAt && (
					<Text as="span">
						{" "}
						&bull; {t("fields.completed")} {timeAgo(order.completedAt)}
					</Text>
				)}
			</Text>
		</VStack>
	);
}

function OrderDetailSkeleton() {
	return (
		<VStack gap="4" align="stretch">
			<Flex align="center" justify="space-between">
				<Skeleton h="6" w="28" />
				<HStack gap="2">
					<Skeleton h="5" w="16" />
					<Skeleton h="5" w="20" />
				</HStack>
			</Flex>
			<VStack gap="2" align="stretch" borderTopWidth="1px" pt="4">
				<Skeleton h="4" w="full" />
				<Skeleton h="4" w="3/4" />
			</VStack>
			<VStack gap="2" align="stretch" borderTopWidth="1px" pt="4">
				<Skeleton h="4" w="full" />
				<Skeleton h="4" w="full" />
			</VStack>
			<Box borderTopWidth="1px" pt="4">
				<Skeleton h="24" w="full" rounded="lg" />
			</Box>
		</VStack>
	);
}
