/**
 * Domain Layer
 *
 * Exports all domains functions organized by capability.
 */

// Domain namespaces
export * as auth from "./auth/index.js";
export * from "./errors.js";
export * as images from "./images/index.js";
export * as menu from "./menu/index.js";
export * as merchants from "./merchants/index.js";
export * as orders from "./orders/index.js";
export * as payments from "./payments/index.js";
export type { IPaymentService, IStoreService } from "./services.js";
// Services aggregator
export { DomainServices, type DomainServicesDeps } from "./services.js";
export * as stores from "./stores/index.js";
