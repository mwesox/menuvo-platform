/**
 * Translations Service Interface
 *
 * Defines the contract for translation operations.
 */

import type {
	categories,
	items,
	optionChoices,
	optionGroups,
} from "@menuvo/db/schema";
import type {
	MissingTranslationReport,
	TranslationStatusResponse,
} from "./types.js";

/**
 * Translations service interface
 */
export interface ITranslationsService {
	getStatus(
		storeId: string,
		merchantId: string,
	): Promise<TranslationStatusResponse>;

	getMissingReport(
		storeId: string,
		merchantId: string,
		languageCode?: string,
	): Promise<MissingTranslationReport>;

	updateCategory(
		categoryId: string,
		merchantId: string,
		languageCode: string,
		name: string,
		description?: string,
	): Promise<typeof categories.$inferSelect>;

	updateItem(
		itemId: string,
		merchantId: string,
		languageCode: string,
		name: string,
		description?: string,
	): Promise<typeof items.$inferSelect>;

	updateOptionGroup(
		optionGroupId: string,
		merchantId: string,
		languageCode: string,
		name: string,
	): Promise<typeof optionGroups.$inferSelect>;

	updateOptionChoice(
		optionChoiceId: string,
		merchantId: string,
		languageCode: string,
		name: string,
	): Promise<typeof optionChoices.$inferSelect>;
}
