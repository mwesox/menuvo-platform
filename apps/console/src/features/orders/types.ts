/**
 * Order Types
 *
 * Types inferred from tRPC router outputs.
 * Following the "API is the boundary" rule - apps never import @menuvo/db directly.
 *
 * Uses tRPC's inferRouterOutputs to derive types from procedure return values.
 */

import type { AppRouter } from "@menuvo/trpc";
import type { inferRouterOutputs } from "@trpc/server";

// Infer types from tRPC router outputs
type RouterOutput = inferRouterOutputs<AppRouter>;

/**
 * Full order detail from getById procedure
 * Includes store, servicePoint, and items with options
 */
export type OrderDetail = NonNullable<RouterOutput["order"]["getById"]>;

/**
 * Order with items (subset of OrderDetail, without store relation)
 * Used in kitchen display and order detail views
 */
export type OrderWithItems = Omit<OrderDetail, "store">;

/**
 * Order list item from listByStore procedure
 * Has simplified items without options (for performance in list views)
 */
export type OrderListItem =
	RouterOutput["order"]["listByStore"]["orders"][number];

/**
 * Single order item from the items array
 */
export type OrderItem = OrderDetail["items"][number];

/**
 * Order status type - re-exported from constants for convenience
 * @see ./constants.ts for the canonical definition
 */
export type { OrderStatus } from "./constants";
