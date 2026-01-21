import { z } from "zod/v4";

// ============================================================================
// LEGAL ENTITY SCHEMAS
// ============================================================================

/**
 * German legal forms enum
 * HRB = Handelsregister Abteilung B (GmbH, UG, AG)
 * HRA = Handelsregister Abteilung A (OHG, KG)
 */
export const legalFormEnum = z.enum([
	"einzelunternehmen", // Sole proprietorship - no register
	"gbr", // GbR - no register
	"ug", // UG (haftungsbeschränkt) - HRB
	"gmbh", // GmbH - HRB
	"ohg", // OHG - HRA
	"kg", // KG - HRA
	"ag", // AG - HRB
	"freiberufler", // Freelancer - no register
	"other", // Other - conditional
]);

export type LegalForm = z.infer<typeof legalFormEnum>;

/** Legal forms that require commercial register (HRB or HRA) */
export const LEGAL_FORMS_REQUIRING_REGISTER: LegalForm[] = [
	"gmbh",
	"ug",
	"ag",
	"ohg",
	"kg",
];

// ============================================================================
// FIELD-LEVEL SCHEMAS
// ============================================================================

// Merchant field schemas
export const merchantNameSchema = z
	.string()
	.min(4, "validation:businessName.min")
	.max(100, "validation:businessName.max");

export const ownerNameSchema = z
	.string()
	.min(2, "validation:ownerName.min")
	.max(100, "validation:ownerName.max")
	.refine(
		(val) => val.trim().split(/\s+/).length >= 2,
		"validation:ownerName.fullName",
	);

export const merchantEmailSchema = z.string().email("validation:email.invalid");

// Phone: E.164 format from react-phone-number-input (e.g., +4917612345678)
export const merchantPhoneSchema = z
	.string()
	.min(1, "validation:phone.required")
	.refine(
		(val) => val.startsWith("+") && val.length >= 8,
		"validation:phone.invalid",
	);

// Store field schemas
export const storeNameSchema = z
	.string()
	.min(2, "validation:storeName.min")
	.max(100, "validation:storeName.max");

export const storeStreetSchema = z
	.string()
	.min(3, "validation:street.required")
	.max(200, "validation:street.max")
	.refine(
		(val) => val.trim().split(/\s+/).length >= 2,
		"validation:street.incomplete",
	);

// German city name: letters, spaces, hyphens, umlauts
const cityNameRegex = /^[a-zA-ZäöüÄÖÜß\s\-'.]+$/;
export const storeCitySchema = z
	.string()
	.min(2, "validation:city.required")
	.max(100, "validation:city.max")
	.refine((val) => cityNameRegex.test(val), "validation:city.invalid");

// German postal code: exactly 5 digits
export const storePostalCodeSchema = z
	.string()
	.length(5, "validation:postalCode.length")
	.regex(/^[0-9]{5}$/, "validation:postalCode.invalid");

export const storeCountrySchema = z
	.string()
	.min(2, "validation:country.required")
	.max(100, "validation:country.max");

// ============================================================================
// STEP-SPECIFIC FORM SCHEMAS (for step validation)
// ============================================================================

// Step 1: Merchant Details
export const merchantStepFormSchema = z.object({
	name: merchantNameSchema,
	ownerName: ownerNameSchema,
	email: merchantEmailSchema,
	phone: merchantPhoneSchema,
});
export type MerchantStepFormInput = z.infer<typeof merchantStepFormSchema>;

// Step 2: Store Details
export const storeStepFormSchema = z.object({
	name: storeNameSchema,
	street: storeStreetSchema,
	city: storeCitySchema,
	postalCode: storePostalCodeSchema,
	country: storeCountrySchema,
});
export type StoreStepFormInput = z.infer<typeof storeStepFormSchema>;

// ============================================================================
// FULL SCHEMAS (composed from step schemas)
// ============================================================================

// Server schema - for server function input validation
export const onboardingSchema = z.object({
	merchant: merchantStepFormSchema.extend({
		phone: z.string().optional(),
	}),
	store: storeStepFormSchema.extend({
		timezone: z.string().default("Europe/Berlin"),
		currency: z.enum(["EUR", "USD", "GBP", "CHF"]).default("EUR"),
	}),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

// Form schema - for client-side form validation
export const onboardingFormSchema = z.object({
	merchant: merchantStepFormSchema,
	store: storeStepFormSchema,
});
export type OnboardingFormInput = z.infer<typeof onboardingFormSchema>;

// ============================================================================
// SLIDE-SPECIFIC SCHEMAS (for per-slide form validation)
// ============================================================================

// Slide 1: Business Name
export const businessSlideSchema = z.object({
	name: merchantNameSchema,
});
export type BusinessSlideInput = z.infer<typeof businessSlideSchema>;

// Slide 2: Owner Name
export const ownerSlideSchema = z.object({
	ownerName: ownerNameSchema,
});
export type OwnerSlideInput = z.infer<typeof ownerSlideSchema>;

// Slide 3: Contact (Email + Phone)
export const contactSlideSchema = z.object({
	email: merchantEmailSchema,
	phone: merchantPhoneSchema,
});
export type ContactSlideInput = z.infer<typeof contactSlideSchema>;

// Slide 4: Store Name
export const storeNameSlideSchema = z.object({
	name: storeNameSchema,
});
export type StoreNameSlideInput = z.infer<typeof storeNameSlideSchema>;

// Slide 5: Address
export const addressSlideSchema = z.object({
	street: storeStreetSchema,
	city: storeCitySchema,
	postalCode: storePostalCodeSchema,
});
export type AddressSlideInput = z.infer<typeof addressSlideSchema>;

// ============================================================================
// LEGAL ENTITY FIELD SCHEMAS
// ============================================================================

export const companyNameSchema = z
	.string()
	.min(2, "validation:companyName.min")
	.max(255, "validation:companyName.max");

export const representativeNameSchema = z
	.string()
	.min(2, "validation:representativeName.min")
	.max(255, "validation:representativeName.max");

export const legalFormOtherSchema = z
	.string()
	.min(2, "validation:legalFormOther.min")
	.max(100, "validation:legalFormOther.max");

export const registerCourtSchema = z
	.string()
	.min(2, "validation:registerCourt.min")
	.max(100, "validation:registerCourt.max");

export const registerNumberSchema = z
	.string()
	.min(2, "validation:registerNumber.min")
	.max(50, "validation:registerNumber.max");

export const vatIdSchema = z
	.string()
	.regex(/^DE[0-9]{9}$/, "validation:vatId.format")
	.or(z.literal(""));

// ============================================================================
// LEGAL ENTITY SLIDE SCHEMAS
// ============================================================================

// Slide 6: Legal Form Selection
export const legalFormSlideSchema = z.object({
	legalForm: legalFormEnum,
	legalFormOther: z.string().optional(),
});
export type LegalFormSlideInput = z.infer<typeof legalFormSlideSchema>;

// Slide 7: Company Details (company name, representative)
export const companyDetailsSlideSchema = z.object({
	companyName: companyNameSchema,
	representativeName: representativeNameSchema,
});
export type CompanyDetailsSlideInput = z.infer<
	typeof companyDetailsSlideSchema
>;

// Slide 8: Register Details (conditional, only for GmbH, UG, AG, OHG, KG)
export const registerDetailsSlideSchema = z.object({
	registerCourt: registerCourtSchema,
	registerNumber: registerNumberSchema,
});
export type RegisterDetailsSlideInput = z.infer<
	typeof registerDetailsSlideSchema
>;

// Slide 9: VAT ID (optional)
export const vatIdSlideSchema = z.object({
	vatId: vatIdSchema.optional().or(z.literal("")),
});
export type VatIdSlideInput = z.infer<typeof vatIdSlideSchema>;

// Combined legal entity schema (for API submission)
export const legalEntitySlideSchema = z
	.object({
		legalForm: legalFormEnum,
		legalFormOther: z.string().optional(),
		companyName: companyNameSchema,
		representativeName: representativeNameSchema,
		registerCourt: z.string().optional(),
		registerNumber: z.string().optional(),
		vatId: z.string().optional(),
	})
	.refine(
		(data) => {
			// If legalForm is 'other', legalFormOther is required
			if (data.legalForm === "other") {
				return !!data.legalFormOther && data.legalFormOther.trim().length >= 2;
			}
			return true;
		},
		{
			message: "validation:legalFormOther.required",
			path: ["legalFormOther"],
		},
	)
	.refine(
		(data) => {
			// If legal form requires register, registerCourt is required
			if (LEGAL_FORMS_REQUIRING_REGISTER.includes(data.legalForm)) {
				return !!data.registerCourt && data.registerCourt.trim().length >= 2;
			}
			return true;
		},
		{
			message: "validation:registerCourt.required",
			path: ["registerCourt"],
		},
	)
	.refine(
		(data) => {
			// If legal form requires register, registerNumber is required
			if (LEGAL_FORMS_REQUIRING_REGISTER.includes(data.legalForm)) {
				return !!data.registerNumber && data.registerNumber.trim().length >= 2;
			}
			return true;
		},
		{
			message: "validation:registerNumber.required",
			path: ["registerNumber"],
		},
	);

export type LegalEntitySlideInput = z.infer<typeof legalEntitySlideSchema>;
