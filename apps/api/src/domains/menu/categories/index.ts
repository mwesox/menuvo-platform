/**
 * Categories Domain
 *
 * Exports categories service, router, and types.
 */

export type { ICategoriesService } from "./interface.js";
export { categoryRouter } from "./router.js";
// Explicit exports from schemas (Zod-inferred types with id)
export type {
	CategoryTranslation,
	CategoryTranslations,
	CreateCategoryInput,
	UpdateCategoryInput as UpdateCategoryApiInput,
} from "./schemas.js";
export { categoryTranslationsSchema } from "./schemas.js";
export { CategoriesService } from "./service.js";
// Explicit exports from types (service-layer types without id)
export type { UpdateCategoryInput } from "./types.js";
