import { z } from "zod/v4";

// ============================================================================
// STORE FORM SCHEMAS
// ============================================================================

// Phone: E.164 format from react-phone-number-input (e.g., +4917612345678)
// Uses superRefine to short-circuit validation - only one error at a time
const storePhoneSchema = z.string().superRefine((val, ctx) => {
	if (!val || val.length === 0) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "validation:phone.required",
		});
		return;
	}
	if (!val.startsWith("+") || val.length < 8) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "validation:phone.invalid",
		});
	}
});

const storeEmailSchema = z.string().superRefine((val, ctx) => {
	if (!val || val.length === 0) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "validation:email.required",
		});
		return;
	}
	if (!z.string().email().safeParse(val).success) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: "validation:email.invalid",
		});
	}
});

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
	phone: storePhoneSchema,
	email: storeEmailSchema,
});
