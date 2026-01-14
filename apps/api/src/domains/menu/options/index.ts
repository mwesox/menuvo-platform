/**
 * Options Domain
 *
 * Exports all option-related domains functions.
 */

export type { IOptionsService } from "./interface.js";
export { optionRouter } from "./router.js";
// Explicit exports from schemas (OptionGroupType comes from schemas, not types)
export type {
	ChoiceTranslations,
	EntityTranslations,
	OptionGroupType,
	PublicOptionChoice,
	PublicOptionGroup,
	// Add other schema types as needed
} from "./schemas.js";
export { optionGroupTypeSchema } from "./schemas.js";
export { OptionsService } from "./service.js";
