import { useDisplayLanguage } from "../contexts/display-language-context.tsx";
import {
	getDisplayDescription,
	getDisplayName,
	withChoiceDisplayName,
	withDisplayFields,
} from "../logic/display.ts";
import type {
	ChoiceTranslations,
	EntityTranslations,
} from "../options.schemas";

/**
 * Hook to get display name from an entity's translations.
 * Uses the current display language from context.
 */
export function useEntityDisplayName(
	translations: EntityTranslations | ChoiceTranslations | null | undefined,
): string {
	const language = useDisplayLanguage();
	return getDisplayName(translations, language);
}

/**
 * Hook to get display description from an entity's translations.
 * Uses the current display language from context.
 */
export function useEntityDisplayDescription(
	translations: EntityTranslations | null | undefined,
): string {
	const language = useDisplayLanguage();
	return getDisplayDescription(translations, language);
}

/**
 * Hook to add displayName and displayDescription to an entity.
 * Uses the current display language from context.
 */
export function useWithDisplayFields<
	T extends { translations: EntityTranslations | null },
>(entity: T): T & { displayName: string; displayDescription: string } {
	const language = useDisplayLanguage();
	return withDisplayFields(entity, language);
}

/**
 * Hook to add displayName to a choice entity.
 * Uses the current display language from context.
 */
export function useWithChoiceDisplayName<
	T extends { translations: ChoiceTranslations | null },
>(entity: T): T & { displayName: string } {
	const language = useDisplayLanguage();
	return withChoiceDisplayName(entity, language);
}

/**
 * Hook to get both display name and description.
 * Convenient for components that need both.
 */
export function useEntityDisplay(
	translations: EntityTranslations | null | undefined,
): { displayName: string; displayDescription: string } {
	const language = useDisplayLanguage();
	return {
		displayName: getDisplayName(translations, language),
		displayDescription: getDisplayDescription(translations, language),
	};
}
