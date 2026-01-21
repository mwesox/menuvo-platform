/**
 * Kitchen view order card - Industrial KDS design.
 * Header color indicates ORDER TYPE (not urgency).
 * Blue = Dine In, Amber = Takeaway.
 * Urgency shown via elapsed time text color.
 */

import {
	Box,
	Button,
	Flex,
	HStack,
	Separator,
	Text,
	VStack,
} from "@chakra-ui/react";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OrderItem, OrderWithItems } from "@/features/orders/types";
import { FAR_AWAY_THRESHOLD_HOURS, type KanbanColumnId } from "../constants";
import { useUrgency } from "../hooks/use-urgency";
import { isOrderTooFarAway } from "../logic/order-sorting";

/** Header colors - HIGH CONTRAST for kitchen visibility */
const headerColors = {
	// Deep blue for dine-in (calm but visible)
	dineIn: "oklch(0.4 0.2 255)",
	dineInFar: "oklch(0.5 0.18 255)",
	// Deep orange/rust for takeaway (urgent, action-oriented)
	takeaway: "oklch(0.55 0.2 50)",
	takeawayFar: "oklch(0.6 0.18 50)",
} as const;

const getHeaderBg = (orderType: string, isFarAway: boolean = false): string => {
	if (orderType === "takeaway") {
		return isFarAway ? headerColors.takeawayFar : headerColors.takeaway;
	}
	return isFarAway ? headerColors.dineInFar : headerColors.dineIn;
};

/** Format pickup time - simple HH:mm or DD.MM HH:mm */
function formatPickupTime(
	scheduledPickupTime: Date | string | null,
	now: number = Date.now(),
): string | null {
	if (!scheduledPickupTime) return null;

	const pickupDate =
		typeof scheduledPickupTime === "string"
			? new Date(scheduledPickupTime)
			: scheduledPickupTime;

	const nowDate = new Date(now);
	const isToday =
		pickupDate.getDate() === nowDate.getDate() &&
		pickupDate.getMonth() === nowDate.getMonth() &&
		pickupDate.getFullYear() === nowDate.getFullYear();

	const timeStr = `${String(pickupDate.getHours()).padStart(2, "0")}:${String(pickupDate.getMinutes()).padStart(2, "0")}`;

	if (isToday) return timeStr;

	// Not today: show date + time
	const dateStr = `${String(pickupDate.getDate()).padStart(2, "0")}.${String(pickupDate.getMonth() + 1).padStart(2, "0")}`;
	return `${dateStr} ${timeStr}`;
}

interface OrderCardKitchenProps {
	order: OrderWithItems & {
		servicePoint?: { id: string; name: string; code: string } | null;
	};
	/** Current column (for done styling and next button visibility) */
	columnId?: KanbanColumnId;
	/** Callback when "Next" button is clicked */
	onNext?: () => void;
	/** Whether this card was the last one moved */
	isLastMoved?: boolean;
	className?: string;
}

export function OrderCardKitchen({
	order,
	columnId,
	onNext,
	isLastMoved,
	className,
}: OrderCardKitchenProps) {
	const { t } = useTranslation("console-kitchen");
	const { level, timeData } = useUrgency(order.confirmedAt);

	const isTableOrder = order.orderType === "dine_in" && order.servicePoint;
	const isTakeaway = order.orderType === "takeaway";
	const isDone = columnId === "done";
	const showNextButton = onNext && columnId !== "done";

	// Check if order is too far away for deprioritization
	const isFarAway = isOrderTooFarAway(
		order,
		Date.now(),
		FAR_AWAY_THRESHOLD_HOURS,
	);

	// Format elapsed time with i18n
	const elapsedText =
		timeData.type === "none"
			? null
			: t(`time.${timeData.type}`, { count: timeData.count });

	// Format pickup time if available
	const pickupTimeText = formatPickupTime(order.scheduledPickupTime);

	// Build order type label
	const orderTypeLabel = isTakeaway
		? t("orderTypes.takeaway")
		: isTableOrder
			? order.servicePoint?.name
			: t("orderTypes.dineIn");

	// Done cards - muted but still readable, retain order type color hint
	if (isDone) {
		return (
			<Box
				overflow="hidden"
				rounded="md"
				bg="bg.panel"
				opacity={0.7}
				shadow="sm"
				className={className}
			>
				<Flex
					alignItems="center"
					justifyContent="space-between"
					gap="1"
					px="3"
					py="1.5"
					textStyle="sm"
					bg={getHeaderBg(order.orderType)}
					color="white"
					opacity={0.8}
				>
					<Text minW="0" truncate>
						{orderTypeLabel}
					</Text>
					<Text
						minW="3ch"
						flexShrink={0}
						textAlign="end"
						fontWeight="bold"
						fontFamily="mono"
						fontSize="lg"
					>
						#{String(order.pickupNumber).padStart(3, "0")}
					</Text>
				</Flex>
				<Box px="3" py="2" color="fg.muted" textStyle="sm">
					{order.items.length} {order.items.length === 1 ? "item" : "items"}
				</Box>
			</Box>
		);
	}

	return (
		<Box
			overflow="hidden"
			rounded="md"
			bg="bg.panel"
			shadow="sm"
			className={`${level === "critical" ? "animate-pulse-subtle" : ""} ${isLastMoved ? "animate-highlight-glow" : ""} ${className || ""}`}
			opacity={isFarAway ? 0.75 : undefined}
			css={isFarAway ? { filter: "grayscale(40%)" } : undefined}
		>
			{/* Header: High contrast, scannable from across kitchen */}
			<Box
				bg={getHeaderBg(order.orderType, isFarAway)}
				color="white"
				px="3"
				py="2"
				opacity={isFarAway ? 0.9 : 1}
			>
				{/* Row 1: Order type + Number */}
				<Flex alignItems="center" justifyContent="space-between" gap="2">
					<Text fontWeight="semibold" truncate>
						{orderTypeLabel}
					</Text>
					<Text
						fontWeight="bold"
						fontFamily="mono"
						fontSize="xl"
						flexShrink={0}
					>
						#{String(order.pickupNumber).padStart(3, "0")}
					</Text>
				</Flex>
				{/* Row 2: Pickup time + Elapsed time */}
				{(pickupTimeText || elapsedText) && (
					<HStack mt="1" gap="2">
						{pickupTimeText && (
							<Text fontWeight="semibold" fontSize="md">
								{pickupTimeText}
							</Text>
						)}
						{pickupTimeText && elapsedText && <Text opacity={0.7}>·</Text>}
						{elapsedText && (
							<Text textStyle="sm" opacity={0.8}>
								{elapsedText}
							</Text>
						)}
					</HStack>
				)}
			</Box>

			{/* Customer name - subtle, for call-outs */}
			{order.customerName && (
				<Box
					truncate
					borderBottomWidth="1px"
					borderColor="border.subtle"
					bg="bg.muted"
					px="3"
					py="1"
					color="fg.muted"
					textStyle="xs"
				>
					{order.customerName}
				</Box>
			)}

			{/* Items list - clean, focused */}
			<VStack gap="0">
				{order.items.map((item: OrderItem, index: number) => (
					<Box key={item.id} w="100%">
						{index > 0 && <Separator />}
						<Box px="3" py="2">
							<HStack gap="2">
								<Text w="5" flexShrink={0} fontWeight="bold" color="fg.muted">
									{item.quantity}
								</Text>
								<Text fontWeight="medium">{item.kitchenName || item.name}</Text>
							</HStack>
							{item.options.length > 0 && (
								<VStack
									gap="0.5"
									alignItems="start"
									ms="7"
									mt="0.5"
									color="fg.muted"
									textStyle="sm"
								>
									{item.options.map((opt: OrderItem["options"][number]) => (
										<HStack key={opt.id} gap="1">
											<Text color="fg.muted" opacity={0.6}>
												•
											</Text>
											<Text>
												{opt.choiceName}
												{opt.quantity > 1 && ` (×${opt.quantity})`}
											</Text>
										</HStack>
									))}
								</VStack>
							)}
						</Box>
					</Box>
				))}
			</VStack>

			{/* Customer notes - yellow bg signals it's a note, no label needed */}
			{order.customerNotes && (
				<Box
					borderTopWidth="1px"
					bg="oklch(0.92 0.08 90)"
					px="3"
					py="2"
					textStyle="sm"
					color="oklch(0.35 0.1 70)"
				>
					{order.customerNotes}
				</Box>
			)}

			{/* Next button - prominent, easy to tap */}
			{showNextButton && (
				<Box borderTopWidth="1px" p="2">
					<Button
						variant="solid"
						colorPalette="gray"
						size="sm"
						width="100%"
						className="pointer-coarse:h-12 pointer-coarse:text-base"
						onClick={(e) => {
							e.stopPropagation();
							onNext();
						}}
						onPointerDown={(e) => e.stopPropagation()}
					>
						<HStack gap="1">
							<Text fontWeight="medium">{t("actions.next")}</Text>
							<ChevronRight size={18} />
						</HStack>
					</Button>
				</Box>
			)}
		</Box>
	);
}
