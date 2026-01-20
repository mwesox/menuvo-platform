/**
 * Item Validation Rules
 *
 * Defines validation rules for items. Each rule has:
 * - code: Unique identifier for i18n lookup
 * - field: Optional field name for UI focusing
 * - check: Function that returns true if the rule is violated
 *
 * All issues block publishing (isPublishable = false when any issue exists).
 */

import type {
	ItemForValidation,
	ItemIssueCode,
	ItemValidationContext,
} from "./types.js";

/**
 * Validation rule definition
 */
export interface ValidationRule {
	code: ItemIssueCode;
	field?: string;
	check: (item: ItemForValidation, ctx: ItemValidationContext) => boolean;
}

/**
 * All validation rules for items
 *
 * Rules are evaluated in order. Any rule that fails creates
 * an issue that blocks publishing.
 */
export const VALIDATION_RULES: ValidationRule[] = [
	{
		code: "MISSING_NAME",
		field: "translations",
		check: (item, ctx) => {
			const translation = item.translations?.[ctx.defaultLanguage];
			const name = translation?.name;
			return !name || name.trim() === "";
		},
	},

	{
		code: "MISSING_VAT_GROUP",
		field: "vatGroupId",
		check: (item, ctx) => {
			// Item needs VAT if neither item nor category has a VAT group
			return !item.vatGroupId && !ctx.categoryDefaultVatGroupId;
		},
	},

	{
		code: "MISSING_CATEGORY",
		field: "categoryId",
		check: (item) => {
			return !item.categoryId;
		},
	},

	{
		code: "ZERO_PRICE",
		field: "price",
		check: (item) => {
			return item.price === 0;
		},
	},

	{
		code: "CATEGORY_INACTIVE",
		field: "categoryId",
		check: (_item, ctx) => {
			return !ctx.categoryIsActive;
		},
	},
];
