/**
 * Item Validation Module
 *
 * Exports validation service and types for item validation.
 */

export { VALIDATION_RULES } from "./rules.js";
export type { IItemValidationService } from "./service.js";
export { ItemValidationService } from "./service.js";
export type {
	ItemForValidation,
	ItemIssue,
	ItemIssueCode,
	ItemValidationContext,
	ItemValidationResult,
} from "./types.js";
