/**
 * Kitchen view order card - Industrial KDS design.
 * Header color indicates ORDER TYPE (not urgency).
 * Blue = Dine In, Amber = Takeaway.
 * Urgency shown via elapsed time text color.
 */

import { Button } from "@menuvo/ui";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OrderItem, OrderWithItems } from "@/features/orders/types";
import { cn } from "@/lib/utils";
import {
	FAR_AWAY_THRESHOLD_HOURS,
	type KanbanColumnId,
	type UrgencyLevel,
} from "../constants";
import { useUrgency } from "../hooks/use-urgency";
import { isOrderTooFarAway } from "../logic/order-sorting";

/** Header style based on ORDER TYPE (not urgency) */
const getHeaderStyle = (
	orderType: string,
	isFarAway: boolean = false,
): string => {
	if (orderType === "takeaway") {
		// Amber = action, needs packaging
		return isFarAway ? "bg-amber-500 text-white" : "bg-amber-600 text-white";
	}
	// Blue = calm, seated, staying (default for dine_in and other types)
	return isFarAway ? "bg-blue-500 text-white" : "bg-blue-700 text-white";
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
const getTimeStyle = (level: UrgencyLevel): string => {
	switch (level) {
		case "critical":
			return "font-bold text-white";
		case "warning":
			return "font-medium text-white/90";
		default:
			return "text-white/80";
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
			<div
				className={cn(
					"overflow-hidden rounded bg-card opacity-60 shadow-sm",
					className,
				)}
			>
				<div
					className={cn(
						"flex items-center justify-between gap-1 px-3 py-1.5 text-sm opacity-80",
						getHeaderStyle(order.orderType),
					)}
				>
					<span className="min-w-0 truncate">{orderTypeLabel}</span>
					<span className="min-w-[3ch] shrink-0 text-end font-bold font-mono text-lg">
						#{String(order.pickupNumber).padStart(3, "0")}
					</span>
				</div>
				<div className="px-3 py-2 text-muted-foreground text-sm">
					{order.items.length} {order.items.length === 1 ? "item" : "items"}
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"overflow-hidden rounded bg-card shadow-sm",
				level === "critical" && "animate-pulse-subtle",
				isLastMoved && "animate-highlight-glow",
				isFarAway && "opacity-65 grayscale-[40%]",
				className,
			)}
		>
			{/* Header: Color by ORDER TYPE - Blue=DineIn, Amber=Takeaway */}
			<div
				className={cn(
					"flex items-center justify-between @[200px]:gap-2 gap-1 px-3 py-2",
					getHeaderStyle(order.orderType, isFarAway),
					isFarAway && "opacity-90",
				)}
			>
				<span className="min-w-0 truncate font-semibold">{orderTypeLabel}</span>
				<div className="flex shrink-0 items-center @[200px]:gap-2 gap-1 text-sm">
					{elapsedText && (
						<span className={cn("@[240px]:inline hidden", getTimeStyle(level))}>
							{elapsedText}
						</span>
					)}
					{pickupTimeText && (
						<span className={cn("@[240px]:inline hidden", getTimeStyle(level))}>
							{pickupTimeText}
						</span>
					)}
					<span className="min-w-[3ch] text-end font-bold font-mono text-xl">
						#{String(order.pickupNumber).padStart(3, "0")}
					</span>
				</div>
			</div>

			{/* Customer name - subtle, for call-outs */}
			{order.customerName && (
				<div className="truncate border-border/50 border-b bg-muted/30 px-3 py-1 text-muted-foreground text-xs">
					{order.customerName}
				</div>
			)}

			{/* Items list - clean, focused */}
			<div className="divide-y divide-border/50">
				{order.items.map((item: OrderItem) => (
					<div key={item.id} className="px-3 py-2">
						<div className="flex gap-2">
							<span className="w-5 shrink-0 font-bold text-muted-foreground">
								{item.quantity}
							</span>
							<span className="font-medium">
								{item.kitchenName || item.name}
							</span>
						</div>
						{item.options.length > 0 && (
							<div className="ms-7 mt-0.5 text-muted-foreground text-sm">
								{item.options.map((opt: OrderItem["options"][number]) => (
									<div key={opt.id} className="flex items-center gap-1">
										<span className="text-muted-foreground/60">•</span>
										{opt.choiceName}
										{opt.quantity > 1 && ` (×${opt.quantity})`}
									</div>
								))}
							</div>
						)}
					</div>
				))}
			</div>

			{/* Customer notes */}
			{order.customerNotes && (
				<div className="border-t bg-amber-50/80 px-3 py-2 text-sm">
					<span className="font-medium text-amber-700">
						{t("labels.notes")}:
					</span>{" "}
					<span className="text-amber-900">{order.customerNotes}</span>
				</div>
			)}

			{/* Next button - move to next column */}
			{showNextButton && (
				<div className="border-t p-2">
					<Button
						variant="secondary"
						size="sm"
						className="pointer-coarse:h-11 w-full pointer-coarse:text-base"
						onClick={(e) => {
							e.stopPropagation();
							onNext();
						}}
						onPointerDown={(e) => e.stopPropagation()}
					>
						{t("actions.next")}
						<ChevronRight className="ms-1 pointer-coarse:size-5 size-4" />
					</Button>
				</div>
			)}
		</div>
	);
}
