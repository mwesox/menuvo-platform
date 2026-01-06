import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { OrderStatus, OrderType, OrderWithItems } from "@/features/orders";
import { formatPrice } from "@/features/orders/logic/order-pricing";
import { cn } from "@/lib/utils";

interface OrderListItemProps {
	order: OrderWithItems;
	isSelected: boolean;
	onSelect: () => void;
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

export function OrderListItem({
	order,
	isSelected,
	onSelect,
}: OrderListItemProps) {
	const { t, i18n } = useTranslation("console-orders");
	const locale = i18n.language === "de" ? de : enUS;

	const timeAgo = formatDistanceToNow(new Date(order.createdAt), {
		addSuffix: true,
		locale,
	});

	return (
		<button
			type="button"
			onClick={onSelect}
			className={cn(
				"flex w-full flex-col gap-2 rounded-lg border p-3 text-start transition-colors hover:bg-accent",
				isSelected && "bg-accent border-primary",
			)}
		>
			{/* Top row: Order number, customer name, time */}
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 min-w-0">
					<span className="font-medium text-sm">#{order.id}</span>
					<span className="text-sm text-muted-foreground truncate">
						{order.customerName || "Guest"}
					</span>
				</div>
				<span className="text-xs text-muted-foreground whitespace-nowrap">
					{timeAgo}
				</span>
			</div>

			{/* Bottom row: Order type, status, total */}
			<div className="flex items-center justify-between gap-2">
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
				<span className="font-medium text-sm">
					{formatPrice(order.totalAmount)}
				</span>
			</div>
		</button>
	);
}
