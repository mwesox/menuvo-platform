/**
 * Closures Domain
 *
 * Exports closures service, router, and types.
 */

export type { IClosuresService } from "./interface.js";
export { closuresRouter } from "./router.js";
// Explicit exports from schemas (Zod-inferred types)
export type {
	CreateClosureInput,
	UpdateClosureInput,
} from "./schemas.js";
export { ClosuresService } from "./service.js";

// types.ts exports the same types, so we don't need to export from there
// (they're kept for backward compatibility but schemas.ts is the source of truth)
