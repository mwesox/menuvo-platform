/**
 * Items Domain
 *
 * Exports items service, router, and types.
 */

export type { IItemsService, ItemWithValidation } from "./interface.js";
export { itemRouter } from "./router.js";
export type * from "./schemas.js";
export { ItemsService } from "./service.js";
export type * from "./types.js";
export type * from "./validation/index.js";
