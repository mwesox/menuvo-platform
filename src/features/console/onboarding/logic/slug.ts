/**
 * Generate a URL-safe slug from a store name.
 * Converts to lowercase, replaces non-alphanumeric chars with hyphens,
 * and trims leading/trailing hyphens.
 */
export function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}
