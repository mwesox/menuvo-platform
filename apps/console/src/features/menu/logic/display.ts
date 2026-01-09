import type {
	ChoiceTranslations,
	EntityTranslations,
} from "@menuvo/trpc/schemas";

/**
 * Get display name from translations.
 * Uses the specified language, falls back to first available.
 */
export function getDisplayName(
	translations: EntityTranslations | ChoiceTranslations | null | undefined,
	language: string,
): string {
	if (!translations) return "";

	// Try specified language
	const trans = translations[language];
	if (trans?.name) return trans.name;

	// Fallback to first available
	for (const t of Object.values(translations)) {
		if (t?.name) return t.name;
	}

	return "";
}

/**
 * Get display description from translations.
 * Uses the specified language, falls back to first available.
 */
export function getDisplayDescription(
	translations: EntityTranslations | null | undefined,
	language: string,
): string {
	if (!translations) return "";

	// Try specified language
	const trans = translations[language];
	if (trans?.description) return trans.description;

	// Fallback to first available
	for (const t of Object.values(translations)) {
		if (t?.description) return t.description;
	}

	return "";
}

/**
 * Add displayName and displayDescription to an entity.
 */
export function withDisplayFields<
	T extends { translations: EntityTranslations | null },
>(
	entity: T,
	language: string,
): T & { displayName: string; displayDescription: string } {
	return {
		...entity,
		displayName: getDisplayName(entity.translations, language),
		displayDescription: getDisplayDescription(entity.translations, language),
	};
}

/**
 * Add displayName to a choice entity (no description).
 */
export function withChoiceDisplayName<
	T extends { translations: ChoiceTranslations | null },
>(entity: T, language: string): T & { displayName: string } {
	return {
		...entity,
		displayName: getDisplayName(entity.translations, language),
	};
}

/**
 * Transform an array of entities to add display fields.
 */
export function withDisplayFieldsArray<
	T extends { translations: EntityTranslations | null },
>(
	entities: T[],
	language: string,
): (T & { displayName: string; displayDescription: string })[] {
	return entities.map((e) => withDisplayFields(e, language));
}
