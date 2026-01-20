/**
 * Order Types
 *
 * Types inferred from tRPC router outputs.
 * Following the "API is the boundary" rule - apps never import @menuvo/db directly.
 *
 * Uses tRPC's inferRouterOutputs to derive types from procedure return values.
 */

import type { AppRouter } from "@menuvo/api/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { OrderStatus, OrderType, PaymentProvider } from "./constants";

// Infer types from tRPC router outputs
type RouterOutput = inferRouterOutputs<AppRouter>;

/**
 * Full order detail from getById procedure
 * Includes store, servicePoint, and items with options
 */
type OrderDetailBase = NonNullable<RouterOutput["order"]["getById"]>;
export type OrderDetail = OrderDetailBase & {
	status: OrderStatus;
	orderType: OrderType;
	orderPaymentProvider: PaymentProvider | null;
};

/**
 * Order with items (subset of OrderDetail, without store relation)
 * Used in kitchen display and order detail views
 */
export type OrderWithItems = Omit<OrderDetail, "store">;

/**
 * Order list item from listByStore procedure
 * Has simplified items without options (for performance in list views)
 */
type OrderListItemBase = RouterOutput["order"]["listByStore"]["orders"][number];
export type OrderListItem = OrderListItemBase & {
	status: OrderStatus;
	orderType: OrderType;
};

/**
 * Single order item from the items array
 */
export type OrderItem = OrderDetail["items"][number];

/**
 * Order status type - re-exported from constants for convenience
 * @see ./constants.ts for the canonical definition
 */
export type { OrderStatus, OrderType, PaymentProvider } from "./constants";

/**
 * Date range presets for order filtering
 */
export const dateRangePresets = ["7", "30", "90", "all"] as const;
export type DateRangePreset = (typeof dateRangePresets)[number];
