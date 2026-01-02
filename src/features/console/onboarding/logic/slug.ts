import slugify from "@sindresorhus/slugify";

/**
 * Generate a URL-safe slug from a store name.
 * Uses @sindresorhus/slugify for proper Unicode transliteration
 * (handles umlauts, accents, non-Latin scripts, etc.)
 */
export function generateSlug(name: string): string {
	return slugify(name);
}
