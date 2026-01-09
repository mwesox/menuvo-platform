/**
 * Merchant Schemas
 *
 * Zod schemas for merchant-related tRPC procedures.
 * Following the Three Schema Rule:
 * - API schemas: Typed for API contracts (defined here)
 * - Form schemas: String-based for HTML inputs (defined in app features)
 * - Database schemas: Drizzle insert/select types (defined in @menuvo/db)
 */

import { z } from "zod";

// ============================================================================
// Merchant Update Schemas - API
// ============================================================================

/**
 * Update merchant general settings - API schema
 * Used for updating merchant profile information
 */
export const updateMerchantGeneralSchema = z.object({
	name: z.string().min(1, "Name is required").max(100).optional(),
	description: z.string().max(500).optional(),
	ownerName: z.string().max(100).optional(),
	email: z.string().email("Invalid email address").optional(),
	phone: z.string().max(20).optional(),
	address: z.string().max(200).optional(),
	city: z.string().max(100).optional(),
	zipCode: z.string().max(20).optional(),
	country: z.string().max(100).optional(),
});

/**
 * Update merchant supported languages - API schema
 * Used for configuring which languages the merchant supports
 */
export const updateMerchantLanguagesSchema = z.object({
	supportedLanguages: z
		.array(z.string().min(1))
		.min(1, "At least one language is required"),
});

// ============================================================================
// Merchant Form Schemas - for client-side validation
// ============================================================================

/**
 * Merchant general settings - Form schema (strings)
 * Used for form validation in the console app
 */
export const merchantGeneralFormSchema = z.object({
	name: z.string().min(1, "Name is required").max(100),
	description: z.string().max(500).optional(),
	ownerName: z.string().max(100).optional(),
	email: z
		.string()
		.email("Please enter a valid email")
		.optional()
		.or(z.literal("")),
	phone: z.string().max(20).optional(),
	address: z.string().max(200).optional(),
	city: z.string().max(100).optional(),
	zipCode: z.string().max(20).optional(),
	country: z.string().max(100).optional(),
});

/**
 * Merchant languages - Form schema
 * Used for language settings form in the console app
 */
export const merchantLanguagesFormSchema = z.object({
	supportedLanguages: z
		.array(z.string())
		.min(1, "Select at least one language"),
});

// ============================================================================
// Type Exports
// ============================================================================

export type UpdateMerchantGeneralInput = z.infer<
	typeof updateMerchantGeneralSchema
>;
export type UpdateMerchantLanguagesInput = z.infer<
	typeof updateMerchantLanguagesSchema
>;
export type MerchantGeneralFormValues = z.infer<
	typeof merchantGeneralFormSchema
>;
export type MerchantLanguagesFormValues = z.infer<
	typeof merchantLanguagesFormSchema
>;
