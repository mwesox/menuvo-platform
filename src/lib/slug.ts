import slugify from "@sindresorhus/slugify";

/**
 * Generate a URL-safe slug from a store name.
 * Uses @sindresorhus/slugify for proper Unicode transliteration.
 */
export function generateSlug(name: string): string {
	return slugify(name);
}
