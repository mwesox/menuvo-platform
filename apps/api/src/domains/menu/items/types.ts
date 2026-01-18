/**
 * Item Domain Types
 *
 * Note: ItemTranslation, ItemTranslations, CreateItemInput, and UpdateItemInput
 * are exported from schemas.ts as Zod-inferred types. This file is kept for any additional
 * domain-specific types that may be needed.
 */

import type { UpdateItemApiInput } from "./schemas.js";

// Re-export types from schemas for convenience
export type {
	CreateItemApiInput as CreateItemInput,
	ItemTranslation,
	ItemTranslations,
} from "./schemas.js";

/**
 * UpdateItemInput for service layer (id is passed separately, so omitted here)
 */
export type UpdateItemInput = Omit<UpdateItemApiInput, "id">;
