/**
 * Orders Domain
 *
 * Exports orders service, router, and types.
 */

export type { IOrderService } from "./interface.js";
export { orderRouter } from "./router.js";
// Explicit exports from schemas (Zod-inferred types)
export type {
	CreateOrderInput,
	OrderItemInput,
	OrderItemOptionInput,
	OrderTypeValue,
} from "./schemas.js";
export { OrderService } from "./service.js";

// Explicit exports from types (domain-specific types not in schemas)
export type {
	CalculatedOrderItem,
	DateRange,
	DbItem,
	ExportOrder,
	ExportParams,
	OptionChoice,
	OptionGroup,
	OrderStats,
	OrderTotals,
} from "./types.js";
