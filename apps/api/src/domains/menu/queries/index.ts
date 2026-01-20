/**
 * Menu Query Module
 *
 * Exports query service and types for cross-domain menu read operations.
 */

export type {
	CategoryItem,
	CategoryWithItems,
	IMenuQueryService,
	ShopItemDetails,
} from "./interface.js";
export type { QueriesRouter } from "./router.js";
export { queriesRouter } from "./router.js";
export { MenuQueryService } from "./service.js";
