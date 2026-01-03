import { z } from "zod";

// ============================================================================
// STORE SERVER SCHEMAS
// ============================================================================

export const createStoreSchema = z.object({
	merchantId: z.number().int().positive(),
	name: z
		.string()
		.min(2, "Store name must be at least 2 characters")
		.max(100, "Store name must be less than 100 characters"),
	street: z.string().min(1, "Street address is required"),
	city: z.string().min(1, "City is required"),
	postalCode: z.string().min(1, "Postal code is required"),
	country: z.string().min(1, "Country is required"),
	phone: z.string().optional(),
	email: z.string().email().optional().or(z.literal("")),
	timezone: z.string().default("Europe/Berlin"),
	currency: z.enum(["EUR", "USD", "GBP", "CHF"]).default("EUR"),
});

export const updateStoreSchema = createStoreSchema
	.omit({ merchantId: true })
	.partial();

// ============================================================================
// STORE FORM SCHEMAS
// ============================================================================

// Client-side form validation schema (without merchantId)
export const storeFormSchema = z.object({
	name: z
		.string()
		.min(2, "Store name must be at least 2 characters")
		.max(100, "Store name must be less than 100 characters"),
	street: z.string().min(1, "Street address is required"),
	city: z.string().min(1, "City is required"),
	postalCode: z.string().min(1, "Postal code is required"),
	country: z.string().min(1, "Country is required"),
	phone: z.string(),
	email: z.string(),
});
export type StoreFormInput = z.infer<typeof storeFormSchema>;

// Store details form schema (settings page)
export const storeDetailsFormSchema = z.object({
	name: z
		.string()
		.min(2, "Store name must be at least 2 characters")
		.max(100, "Store name must be less than 100 characters"),
	street: z.string().min(1, "Street address is required"),
	city: z.string().min(1, "City is required"),
	postalCode: z.string().min(1, "Postal code is required"),
	country: z.string().min(1, "Country is required"),
	phone: z.string(),
	email: z.string(),
});
export type StoreDetailsFormInput = z.infer<typeof storeDetailsFormSchema>;

// ============================================================================
// OTHER SCHEMAS
// ============================================================================

export const storeIdSchema = z.object({
	storeId: z.number().int().positive(),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;
