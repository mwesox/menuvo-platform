/**
 * Options Service Interface
 *
 * Defines the contract for option group and choice operations.
 */

import type { optionChoices, optionGroups } from "@menuvo/db/schema";
import type {
	ChoiceTranslations,
	EntityTranslations,
	OptionGroupType,
	PublicOptionChoice,
	PublicOptionGroup,
} from "./schemas.js";

/**
 * Options service interface
 */
export interface IOptionsService {
	listGroups(
		storeId: string,
		merchantId: string,
	): Promise<(PublicOptionGroup & { choices: PublicOptionChoice[] })[]>;
	getGroup(
		optionGroupId: string,
		merchantId: string,
	): Promise<
		PublicOptionGroup & { choices: PublicOptionChoice[]; itemCount: number }
	>;
	createGroup(
		storeId: string,
		merchantId: string,
		input: {
			translations: EntityTranslations;
			type: OptionGroupType;
			minSelections: number;
			maxSelections: number | null;
			isRequired: boolean;
			numFreeOptions: number;
			aggregateMinQuantity: number | null;
			aggregateMaxQuantity: number | null;
			displayOrder?: number;
		},
	): Promise<typeof optionGroups.$inferSelect>;
	updateGroup(
		optionGroupId: string,
		merchantId: string,
		input: {
			translations?: EntityTranslations;
			type?: OptionGroupType;
			minSelections?: number;
			maxSelections?: number | null;
			isRequired?: boolean;
			numFreeOptions?: number;
			aggregateMinQuantity?: number | null;
			aggregateMaxQuantity?: number | null;
		},
	): Promise<typeof optionGroups.$inferSelect>;
	toggleGroupActive(
		optionGroupId: string,
		merchantId: string,
		isActive: boolean,
	): Promise<typeof optionGroups.$inferSelect>;
	deleteGroup(optionGroupId: string, merchantId: string): Promise<void>;
	saveGroupWithChoices(input: {
		optionGroupId?: string;
		storeId: string;
		merchantId: string;
		choices: Array<{
			id?: string;
			translations: ChoiceTranslations;
			priceModifier: number;
			isDefault?: boolean;
			minQuantity?: number;
			maxQuantity?: number | null;
		}>;
		type?: OptionGroupType;
		minSelections?: number;
		maxSelections?: number | null;
		numFreeOptions?: number;
		aggregateMinQuantity?: number | null;
		aggregateMaxQuantity?: number | null;
		translations: EntityTranslations;
	}): Promise<PublicOptionGroup & { choices: PublicOptionChoice[] }>;
	listChoices(
		optionGroupId: string,
		merchantId: string,
	): Promise<PublicOptionChoice[]>;
	createChoice(
		optionGroupId: string,
		merchantId: string,
		input: {
			translations: ChoiceTranslations;
			priceModifier: number;
			isDefault: boolean;
			minQuantity: number;
			maxQuantity: number | null;
			displayOrder?: number;
		},
	): Promise<typeof optionChoices.$inferSelect>;
	updateChoice(
		optionChoiceId: string,
		merchantId: string,
		input: {
			translations?: ChoiceTranslations;
			priceModifier?: number;
			isDefault?: boolean;
			minQuantity?: number;
			maxQuantity?: number | null;
		},
	): Promise<typeof optionChoices.$inferSelect>;
	toggleChoiceAvailable(
		optionChoiceId: string,
		merchantId: string,
		isAvailable: boolean,
	): Promise<typeof optionChoices.$inferSelect>;
	deleteChoice(optionChoiceId: string, merchantId: string): Promise<void>;
	getItemOptions(
		itemId: string,
		merchantId: string,
	): Promise<(PublicOptionGroup & { choices: PublicOptionChoice[] })[]>;
	updateItemOptions(
		itemId: string,
		merchantId: string,
		optionGroupIds: string[],
	): Promise<(PublicOptionGroup & { choices: PublicOptionChoice[] })[]>;
}
