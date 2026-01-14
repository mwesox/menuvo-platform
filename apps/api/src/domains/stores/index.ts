/**
 * Stores Domain
 *
 * Exports stores service, router, types, and utilities.
 */

export type { IStoreService } from "./interface.js";
export { storeRouter } from "./router.js";
export type * from "./schemas.js";
export { StoreService } from "./service.js";
export type * from "./types.js";
export { findUniqueSlug, generateSlug } from "./utils.js";
