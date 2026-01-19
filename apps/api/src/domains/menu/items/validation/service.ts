/**
 * Item Validation Service
 *
 * Service that validates items against all defined rules and returns
 * a validation result indicating whether the item can be published.
 */

import { VALIDATION_RULES } from "./rules.js";
import type {
	ItemForValidation,
	ItemIssue,
	ItemValidationContext,
	ItemValidationResult,
} from "./types.js";

/**
 * Service interface for item validation
 */
export interface IItemValidationService {
	/**
	 * Validate an item against all rules
	 *
	 * @param item - Item data to validate
	 * @param context - Validation context with category/store settings
	 * @returns Validation result with issues and publish status
	 */
	validate(
		item: ItemForValidation,
		context: ItemValidationContext,
	): ItemValidationResult;
}

/**
 * Item Validation Service implementation
 */
export class ItemValidationService implements IItemValidationService {
	/**
	 * Validate an item against all rules
	 */
	validate(
		item: ItemForValidation,
		context: ItemValidationContext,
	): ItemValidationResult {
		const issues: ItemIssue[] = [];

		// Run each validation rule
		for (const rule of VALIDATION_RULES) {
			if (rule.check(item, context)) {
				issues.push({
					code: rule.code,
					field: rule.field,
				});
			}
		}

		return {
			issues,
			hasIssues: issues.length > 0,
			isPublishable: issues.length === 0,
		};
	}
}
