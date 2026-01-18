/**
 * Translations Domain Types
 */

import type { Database } from "@menuvo/db";
import type {
	ChoiceTranslations,
	categories,
	EntityTranslations,
	items,
	optionChoices,
	optionGroups,
} from "@menuvo/db/schema";

export interface TranslationsDeps {
	db: Database;
}

export type TranslationStatus = "complete" | "partial" | "missing";

// Re-export types from schema for convenience
export type { ChoiceTranslations, EntityTranslations };

/**
 * Translation status response for a single entity
 */
export type EntityTranslationStatus = {
	translationStatus: TranslationStatus;
	translationStatusByLanguage: Record<string, TranslationStatus>;
};

/**
 * Category with translation status
 */
export type CategoryWithTranslationStatus = typeof categories.$inferSelect &
	EntityTranslationStatus;

/**
 * Item with translation status
 */
export type ItemWithTranslationStatus = typeof items.$inferSelect &
	EntityTranslationStatus;

/**
 * Option group with translation status and choices
 */
export type OptionGroupWithTranslationStatus =
	typeof optionGroups.$inferSelect &
		EntityTranslationStatus & {
			choices: (typeof optionChoices.$inferSelect & EntityTranslationStatus)[];
		};

/**
 * Translation status response
 */
export type TranslationStatusResponse = {
	fallbackLanguage: string;
	supportedLanguages: string[];
	categories: CategoryWithTranslationStatus[];
	items: ItemWithTranslationStatus[];
	optionGroups: OptionGroupWithTranslationStatus[];
};

/**
 * Missing translation report item
 */
export type MissingTranslationItem = {
	id: string;
	name: string;
	missingLanguages: string[];
};

/**
 * Missing translation report for option choice
 */
export type MissingTranslationChoice = MissingTranslationItem & {
	optionGroupId: string;
};

/**
 * Missing translation report
 */
export type MissingTranslationReport = {
	summary: {
		totalItems: number;
		missingCount: number;
		completeCount: number;
		completionPercentage: number;
	};
	missing: {
		categories: MissingTranslationItem[];
		items: MissingTranslationItem[];
		optionGroups: MissingTranslationItem[];
		optionChoices: MissingTranslationChoice[];
	};
};
