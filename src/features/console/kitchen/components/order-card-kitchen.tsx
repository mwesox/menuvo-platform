/**
 * Kitchen view order card - clean, utilitarian design inspired by Clover POS.
 * Focus on items, minimal chrome, urgency via background color.
 */

import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OrderWithItems } from "@/features/orders/types";
import { cn } from "@/lib/utils";
import type { UrgencyLevel } from "../constants";
import { useUrgency } from "../hooks/use-urgency";

/** Header background based on urgency + order type */
const getHeaderStyle = (level: UrgencyLevel, isTakeaway: boolean): string => {
	if (isTakeaway) {
		// Takeaway always orange - needs packaging attention
		return "bg-orange-500 text-white dark:bg-orange-600";
	}
	switch (level) {
		case "critical":
			return "bg-red-500 text-white dark:bg-red-600";
		case "warning":
			return "bg-yellow-400 text-yellow-950 dark:bg-yellow-500";
		default:
			return "bg-muted text-foreground";
	}
};

interface OrderCardKitchenProps {
	order: OrderWithItems & {
		servicePoint?: { id: number; name: string; code: string } | null;
	};
	/** Whether this card is in the done column (muted styling) */
	isDone?: boolean;
	className?: string;
}

export function OrderCardKitchen({
	order,
	isDone,
	className,
}: OrderCardKitchenProps) {
	const { t } = useTranslation("console-kitchen");
	const { level, timeData } = useUrgency(order.confirmedAt);

	const isTableOrder = order.orderType === "dine_in" && order.servicePoint;
	const isTakeaway = order.orderType === "takeaway";

	// Format elapsed time with i18n
	const elapsedText =
		timeData.type === "none"
			? null
			: t(`time.${timeData.type}`, { count: timeData.count });

	// Build order type label
	const orderTypeLabel = isTakeaway
		? t("orderTypes.takeaway")
		: isTableOrder
			? order.servicePoint?.name
			: t("orderTypes.dineIn");

	// Done cards - minimal
	if (isDone) {
		return (
			<div
				className={cn(
					"overflow-hidden rounded border bg-card opacity-50",
					className,
				)}
			>
				<div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
					<span>{orderTypeLabel}</span>
					<span className="font-mono">#{order.id}</span>
				</div>
				<div className="px-3 py-2 text-sm text-muted-foreground">
					{order.items.length} {order.items.length === 1 ? "item" : "items"}
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"overflow-hidden rounded border bg-card",
				level === "critical" && "animate-pulse-subtle",
				className,
			)}
		>
			{/* Header: Order type + Order number + Time */}
			<div
				className={cn(
					"flex items-center justify-between px-3 py-1.5",
					getHeaderStyle(level, isTakeaway),
				)}
			>
				<div className="flex items-center gap-1.5 font-semibold">
					{isTakeaway && <Package className="size-4" />}
					<span>{orderTypeLabel}</span>
				</div>
				<div className="flex items-center gap-2 text-sm">
					{elapsedText && <span className="opacity-80">{elapsedText}</span>}
					<span className="font-mono font-bold">#{order.id}</span>
				</div>
			</div>

			{/* Items list - clean, focused */}
			<div className="divide-y divide-border/50">
				{order.items.map((item) => (
					<div key={item.id} className="px-3 py-2">
						<div className="flex gap-2">
							<span className="w-5 shrink-0 font-bold text-muted-foreground">
								{item.quantity}
							</span>
							<span className="font-medium">{item.name}</span>
						</div>
						{item.options.length > 0 && (
							<div className="ml-7 mt-0.5 text-sm text-muted-foreground">
								{item.options.map((opt) => (
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
				<div className="border-t bg-amber-50/80 px-3 py-2 text-sm dark:bg-amber-950/30">
					<span className="font-medium text-amber-700 dark:text-amber-300">
						{t("labels.notes")}:
					</span>{" "}
					<span className="text-amber-900 dark:text-amber-100">
						{order.customerNotes}
					</span>
				</div>
			)}
		</div>
	);
}
