/**
 * Manager view order card - full details including customer info and payment.
 */

import {
	Clock,
	CreditCard,
	Mail,
	Phone,
	Store,
	User,
	Utensils,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
	ORDER_TYPE_LABELS,
	PAYMENT_STATUS_LABELS,
} from "@/features/orders/constants";
import { getPaymentStatusColor } from "@/features/orders/logic/order-status";
import type { OrderWithItems } from "@/features/orders/types";
import { cn } from "@/lib/utils";
import { UrgencyIndicator } from "./urgency-indicator";

interface OrderCardManagerProps {
	order: OrderWithItems & {
		servicePoint?: { id: number; name: string; code: string } | null;
	};
	className?: string;
}

export function OrderCardManager({ order, className }: OrderCardManagerProps) {
	const { t } = useTranslation("console-kitchen");

	const orderNumber = `#${order.id}`;
	const isTableOrder = order.orderType === "dine_in" && order.servicePoint;
	const paymentStatusVariant = getPaymentStatusColor(order.paymentStatus);

	// Format price in cents to currency
	const formatPrice = (cents: number) => {
		return new Intl.NumberFormat("de-DE", {
			style: "currency",
			currency: "EUR",
		}).format(cents / 100);
	};

	return (
		<Card className={cn("overflow-hidden", className)}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 bg-muted/50 p-3">
				<div className="flex items-center gap-2">
					{/* Order identifier */}
					<span className="text-lg font-bold">{orderNumber}</span>

					{/* Table/Service point indicator */}
					{isTableOrder && (
						<Badge variant="secondary" className="gap-1">
							<Store className="size-3" />
							{order.servicePoint?.name}
						</Badge>
					)}

					{/* Order type */}
					<Badge variant="outline" className="gap-1">
						{order.orderType === "dine_in" ? (
							<Store className="size-3" />
						) : (
							<Utensils className="size-3" />
						)}
						{ORDER_TYPE_LABELS[order.orderType]}
					</Badge>

					{/* Payment status */}
					<Badge variant={paymentStatusVariant} className="gap-1">
						<CreditCard className="size-3" />
						{PAYMENT_STATUS_LABELS[order.paymentStatus]}
					</Badge>
				</div>

				{/* Urgency timer */}
				<UrgencyIndicator confirmedAt={order.confirmedAt} size="md" />
			</CardHeader>

			<CardContent className="space-y-3 p-3">
				{/* Customer info */}
				{(order.customerName || order.customerEmail || order.customerPhone) && (
					<div className="flex flex-wrap gap-3 text-sm">
						{order.customerName && (
							<span className="flex items-center gap-1 text-muted-foreground">
								<User className="size-3" />
								{order.customerName}
							</span>
						)}
						{order.customerEmail && (
							<span className="flex items-center gap-1 text-muted-foreground">
								<Mail className="size-3" />
								{order.customerEmail}
							</span>
						)}
						{order.customerPhone && (
							<span className="flex items-center gap-1 text-muted-foreground">
								<Phone className="size-3" />
								{order.customerPhone}
							</span>
						)}
					</div>
				)}

				{/* Items list */}
				<ul className="space-y-2 text-sm">
					{order.items.map((item) => (
						<li
							key={item.id}
							className="flex items-start justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0"
						>
							<div className="flex-1">
								<span className="font-medium">
									{item.quantity}x {item.name}
								</span>
								{/* Options */}
								{item.options.length > 0 && (
									<div className="text-xs text-muted-foreground">
										{item.options.map((opt, idx) => (
											<span key={opt.id}>
												{idx > 0 && ", "}
												{opt.choiceName}
												{opt.quantity > 1 && ` (x${opt.quantity})`}
											</span>
										))}
									</div>
								)}
							</div>
							<span className="text-muted-foreground">
								{formatPrice(item.totalPrice)}
							</span>
						</li>
					))}
				</ul>

				{/* Total */}
				<div className="flex items-center justify-between border-t border-border pt-2 font-medium">
					<span>{t("labels.total")}</span>
					<span>{formatPrice(order.totalAmount)}</span>
				</div>

				{/* Customer notes if any */}
				{order.customerNotes && (
					<div className="rounded bg-yellow-50 p-2 text-xs dark:bg-yellow-950">
						<span className="font-medium">{t("labels.notes")}:</span>{" "}
						{order.customerNotes}
					</div>
				)}

				{/* Merchant notes if any */}
				{order.merchantNotes && (
					<div className="rounded bg-blue-50 p-2 text-xs dark:bg-blue-950">
						<span className="font-medium">{t("labels.merchantNotes")}:</span>{" "}
						{order.merchantNotes}
					</div>
				)}

				{/* Timestamps */}
				<div className="flex gap-3 text-xs text-muted-foreground">
					<span className="flex items-center gap-1">
						<Clock className="size-3" />
						{new Date(order.createdAt).toLocaleTimeString("de-DE", {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
