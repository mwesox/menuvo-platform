import { z } from "zod";

/**
 * Schema for filtering public stores.
 */
export const publicStoresFilterSchema = z
	.object({
		city: z.string().optional(),
		search: z.string().optional(),
	})
	.optional();

export type PublicStoresFilter = z.infer<typeof publicStoresFilterSchema>;

/**
 * Schema for getting a store by slug.
 */
export const storeBySlugSchema = z.object({
	slug: z.string().min(1, "Store slug is required"),
});

export type StoreBySlugInput = z.infer<typeof storeBySlugSchema>;
