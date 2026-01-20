/**
 * Category Domain Types
 *
 * Note: CategoryTranslation, CategoryTranslations, CreateCategoryInput, and UpdateCategoryInput
 * are exported from schemas.ts as Zod-inferred types. This file re-exports them for convenience.
 */

import type { UpdateCategoryInput as UpdateCategoryApiInput } from "./schemas.js";

// Re-export types from schemas for convenience
export type {
	CategoryTranslation,
	CategoryTranslations,
	CreateCategoryInput,
} from "./schemas.js";

/**
 * UpdateCategoryInput for service layer (id is passed separately, so omitted here)
 */
export type UpdateCategoryInput = Omit<UpdateCategoryApiInput, "id">;
