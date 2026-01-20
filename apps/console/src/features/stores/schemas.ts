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
// Uses "validation:" prefix keys for i18n translation via FieldError component
export const storeFormSchema = z.object({
	name: z
		.string()
		.min(2, "validation:storeName.minLength")
		.max(100, "validation:storeName.maxLength"),
	street: z.string().min(1, "validation:street.required"),
	city: z.string().min(1, "validation:city.required"),
	postalCode: z.string().min(1, "validation:postalCode.required"),
	country: z.string().min(1, "validation:country.required"),
	phone: storePhoneSchema,
	email: storeEmailSchema,
});

// ============================================================================
// CLOSURE FORM SCHEMA (Client-side validation)
// ============================================================================

export const closureFormSchema = z
	.object({
		startDate: z.string().min(1, "validation:date.invalid"),
		endDate: z.string().min(1, "validation:date.invalid"),
		reason: z.string(),
	})
	.refine((data) => data.endDate >= data.startDate, {
		message: "validation:closure.endBeforeStart",
		path: ["endDate"],
	});
