import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	type OrderStatus,
	type OrderType,
	orderQueries,
} from "@/features/orders";
import { formatPrice } from "@/features/orders/logic/order-pricing";

interface OrderDetailProps {
	orderId: number;
}

const statusVariants: Record<
	OrderStatus,
	"default" | "secondary" | "destructive" | "outline"
> = {
	awaiting_payment: "outline",
	confirmed: "default",
	preparing: "secondary",
	ready: "default",
	completed: "secondary",
	cancelled: "destructive",
};

const orderTypeVariants: Record<
	OrderType,
	"default" | "secondary" | "outline"
> = {
	dine_in: "outline",
	takeaway: "secondary",
	delivery: "default",
};

export function OrderDetail({ orderId }: OrderDetailProps) {
	const { t, i18n } = useTranslation("console-orders");
	const locale = i18n.language === "de" ? de : enUS;

	const {
		data: order,
		isLoading,
		error,
	} = useQuery(orderQueries.detail(orderId));

	if (isLoading) {
		return <OrderDetailSkeleton />;
	}

	if (error) {
		return (
			<div className="flex h-full items-center justify-center text-destructive">
				Error loading order: {error.message}
			</div>
		);
	}

	if (!order) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				Order not found
			</div>
		);
	}

	const timeAgo = (date: Date | string | null) => {
		if (!date) return null;
		return formatDistanceToNow(new Date(date), { addSuffix: true, locale });
	};

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-lg">
					{t("orderNumber", { id: order.id })}
				</h2>
				<div className="flex items-center gap-2">
					<Badge
						variant={orderTypeVariants[order.orderType]}
						className="text-xs"
					>
						{t(`orderType.${order.orderType}`)}
					</Badge>
					<Badge variant={statusVariants[order.status]} className="text-xs">
						{t(`status.${order.status}`)}
					</Badge>
				</div>
			</div>

			{/* Customer Section */}
			<div className="space-y-1 border-t pt-4 text-sm">
				{order.customerName && (
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("fields.name")}</span>
						<span>{order.customerName}</span>
					</div>
				)}
				{order.customerEmail && (
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("fields.email")}</span>
						<span className="ms-4 truncate">{order.customerEmail}</span>
					</div>
				)}
				{order.customerPhone && (
					<div className="flex justify-between">
						<span className="text-muted-foreground">{t("fields.phone")}</span>
						<span>{order.customerPhone}</span>
					</div>
				)}
				{order.servicePoint && (
					<div className="flex justify-between">
						<span className="text-muted-foreground">
							{t("fields.servicePoint")}
						</span>
						<span>{order.servicePoint.name}</span>
					</div>
				)}
				{order.customerNotes && (
					<div className="pt-1">
						<span className="text-muted-foreground text-xs">
							{t("fields.notes")}:
						</span>
						<p className="mt-0.5 text-sm">{order.customerNotes}</p>
					</div>
				)}
			</div>

			{/* Items Section */}
			<div className="space-y-2 border-t pt-4">
				{order.items.map((item) => (
					<div key={item.id} className="space-y-0.5">
						<div className="flex justify-between text-sm">
							<span>
								{item.quantity}x {item.name}
							</span>
							<span className="font-medium">
								{formatPrice(item.totalPrice)}
							</span>
						</div>
						{item.options.length > 0 && (
							<div className="space-y-0.5 ps-4">
								{item.options.map((option) => (
									<div
										key={option.id}
										className="flex justify-between text-muted-foreground text-xs"
									>
										<span>
											{option.quantity > 1 ? `${option.quantity}x ` : ""}
											{option.choiceName}
										</span>
										{option.priceModifier > 0 && (
											<span>
												+{formatPrice(option.priceModifier * option.quantity)}
											</span>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				))}
			</div>

			{/* Payment Summary */}
			<div className="space-y-3 border-t pt-4">
				<div className="space-y-1 rounded-lg bg-muted/50 p-3">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">
							{t("fields.subtotal")}
						</span>
						<span>{formatPrice(order.subtotal)}</span>
					</div>
					{order.taxAmount > 0 && (
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">{t("fields.tax")}</span>
							<span>{formatPrice(order.taxAmount)}</span>
						</div>
					)}
					{order.tipAmount > 0 && (
						<div className="flex justify-between text-sm">
							<span className="text-muted-foreground">{t("fields.tip")}</span>
							<span>{formatPrice(order.tipAmount)}</span>
						</div>
					)}
					<div className="flex justify-between border-border/50 border-t pt-1 font-medium">
						<span>{t("fields.total")}</span>
						<span>{formatPrice(order.totalAmount)}</span>
					</div>
				</div>
				<div className="text-muted-foreground text-xs">
					{t(`paymentStatus.${order.paymentStatus}`)}
					{order.paymentMethod && (
						<span className="capitalize"> via {order.paymentMethod}</span>
					)}
				</div>
			</div>

			{/* Timeline Footer */}
			<div className="border-t pt-3 text-muted-foreground text-xs">
				{t("fields.created")} {timeAgo(order.createdAt)}
				{order.confirmedAt && (
					<span>
						{" "}
						&bull; {t("fields.confirmed")} {timeAgo(order.confirmedAt)}
					</span>
				)}
				{order.completedAt && (
					<span>
						{" "}
						&bull; {t("fields.completed")} {timeAgo(order.completedAt)}
					</span>
				)}
			</div>
		</div>
	);
}

function OrderDetailSkeleton() {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Skeleton className="h-6 w-28" />
				<div className="flex gap-2">
					<Skeleton className="h-5 w-16" />
					<Skeleton className="h-5 w-20" />
				</div>
			</div>
			<div className="space-y-2 border-t pt-4">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
			</div>
			<div className="space-y-2 border-t pt-4">
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-full" />
			</div>
			<div className="border-t pt-4">
				<Skeleton className="h-24 w-full rounded-lg" />
			</div>
		</div>
	);
}
