export const ORDER_STATUSES = [
	"pending",
	"confirmed",
	"preparing",
	"ready",
	"completed",
	"cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
	pending: "Pending",
	confirmed: "Confirmed",
	preparing: "Preparing",
	ready: "Ready",
	completed: "Completed",
	cancelled: "Cancelled",
};

export const KITCHEN_COLUMNS = ["pending", "preparing", "ready"] as const;
export type KitchenColumn = (typeof KITCHEN_COLUMNS)[number];
