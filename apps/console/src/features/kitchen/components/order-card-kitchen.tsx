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
import {
	FAR_AWAY_THRESHOLD_HOURS,
	type KanbanColumnId,
	type UrgencyLevel,
} from "../constants";
import { useUrgency } from "../hooks/use-urgency";
import { isOrderTooFarAway } from "../logic/order-sorting";

/** Header style based on ORDER TYPE (not urgency) */
const getHeaderBg = (orderType: string, isFarAway: boolean = false): string => {
	if (orderType === "takeaway") {
		// Amber = action, needs packaging
		return isFarAway ? "amber.500" : "amber.600";
	}
	// Blue = calm, seated, staying (default for dine_in and other types)
	return isFarAway ? "blue.500" : "blue.700";
};

/**
 * Format pickup time for display.
 * Shows time only for today, "Tomorrow, HH:mm" for tomorrow, or full date for later.
 */
function formatPickupTime(
	scheduledPickupTime: Date | string | null,
	now: number = Date.now(),
	locale: string = "en",
): string | null {
	if (!scheduledPickupTime) return null;

	const pickupDate =
		typeof scheduledPickupTime === "string"
			? new Date(scheduledPickupTime)
			: scheduledPickupTime;

	const nowDate = new Date(now);
	const today = new Date(
		nowDate.getFullYear(),
		nowDate.getMonth(),
		nowDate.getDate(),
	);
	const pickupDay = new Date(
		pickupDate.getFullYear(),
		pickupDate.getMonth(),
		pickupDate.getDate(),
	);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const isToday = pickupDay.getTime() === today.getTime();
	const isTomorrow = pickupDay.getTime() === tomorrow.getTime();

	const timeStr = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(pickupDate);

	if (isToday) return locale === "de" ? `${timeStr} Uhr` : timeStr;
	if (isTomorrow) {
		const tomorrowLabel = locale === "de" ? "Morgen" : "Tomorrow";
		return locale === "de"
			? `${tomorrowLabel}, ${timeStr} Uhr`
			: `${tomorrowLabel}, ${timeStr}`;
	}

	// For later dates, show full date
	const dateStr = new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-US", {
		day: "2-digit",
		month: "2-digit",
	}).format(pickupDate);
	return locale === "de"
		? `${dateStr}, ${timeStr} Uhr`
		: `${dateStr}, ${timeStr}`;
}

/** Time text style based on urgency - white text on colored backgrounds */
const getTimeTextStyle = (level: UrgencyLevel) => {
	switch (level) {
		case "critical":
			return { fontWeight: "bold", color: "white" };
		case "warning":
			return { fontWeight: "medium", color: "white", opacity: 0.9 };
		default:
			return { color: "white", opacity: 0.8 };
	}
};

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
	const { t, i18n } = useTranslation("console-kitchen");
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
	const pickupTimeText = formatPickupTime(
		order.scheduledPickupTime,
		Date.now(),
		i18n.language,
	);

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
				opacity={0.6}
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

	const timeTextStyle = getTimeTextStyle(level);

	return (
		<Box
			overflow="hidden"
			rounded="md"
			bg="bg.panel"
			shadow="sm"
			className={`${level === "critical" ? "animate-pulse-subtle" : ""} ${isLastMoved ? "animate-highlight-glow" : ""} ${className || ""}`}
			opacity={isFarAway ? 0.65 : undefined}
			css={isFarAway ? { filter: "grayscale(40%)" } : undefined}
		>
			{/* Header: Color by ORDER TYPE - Blue=DineIn, Amber=Takeaway */}
			<Flex
				alignItems="center"
				justifyContent="space-between"
				gap="1"
				px="3"
				py="2"
				bg={getHeaderBg(order.orderType, isFarAway)}
				color="white"
				opacity={isFarAway ? 0.9 : 1}
				className="@[200px]:gap-2"
			>
				<Text minW="0" truncate fontWeight="semibold">
					{orderTypeLabel}
				</Text>
				<HStack
					gap="1"
					flexShrink={0}
					textStyle="sm"
					className="@[200px]:gap-2"
				>
					{elapsedText && (
						<Text display="none" className="@[240px]:inline" {...timeTextStyle}>
							{elapsedText}
						</Text>
					)}
					{pickupTimeText && (
						<Text display="none" className="@[240px]:inline" {...timeTextStyle}>
							{pickupTimeText}
						</Text>
					)}
					<Text
						minW="3ch"
						textAlign="end"
						fontWeight="bold"
						fontFamily="mono"
						fontSize="xl"
					>
						#{String(order.pickupNumber).padStart(3, "0")}
					</Text>
				</HStack>
			</Flex>

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

			{/* Customer notes */}
			{order.customerNotes && (
				<Box
					borderTopWidth="1px"
					bg="bg.warning"
					opacity={0.8}
					px="3"
					py="2"
					textStyle="sm"
				>
					<Text as="span" fontWeight="medium" color="fg.warning">
						{t("labels.notes")}:
					</Text>{" "}
					<Text as="span" color="fg">
						{order.customerNotes}
					</Text>
				</Box>
			)}

			{/* Next button - move to next column */}
			{showNextButton && (
				<Box borderTopWidth="1px" p="2">
					<Button
						variant="subtle"
						size="sm"
						width="100%"
						className="pointer-coarse:h-11 pointer-coarse:text-base"
						onClick={(e) => {
							e.stopPropagation();
							onNext();
						}}
						onPointerDown={(e) => e.stopPropagation()}
					>
						<HStack gap="1">
							<Text>{t("actions.next")}</Text>
							<Box className="pointer-coarse:size-5">
								<ChevronRight size={16} />
							</Box>
						</HStack>
					</Button>
				</Box>
			)}
		</Box>
	);
}
