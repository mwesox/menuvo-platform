/**
 * Auth Schemas
 *
 * Zod schemas for authentication-related API inputs.
 */

import { z } from "zod";

/**
 * Dev login schema
 */
export const devLoginSchema = z.object({
	merchantId: z.string().uuid(),
});

export type DevLoginInput = z.infer<typeof devLoginSchema>;

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

/**
 * Legal entity schema for merchant onboarding
 * Conditional fields based on legal form
 */
export const legalEntitySchema = z
	.object({
		legalForm: legalFormEnum,
		legalFormOther: z.string().min(2).max(100).optional(),
		companyName: z.string().min(2).max(255),
		representativeName: z.string().min(2).max(255),
		registerCourt: z.string().min(2).max(100).optional(),
		registerNumber: z.string().min(2).max(50).optional(),
		vatId: z
			.string()
			.regex(/^DE[0-9]{9}$/, "VAT ID must be in format DE123456789")
			.optional()
			.or(z.literal("")),
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
			message: "Please specify your legal form",
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
			message: "Register court is required for this legal form",
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
			message: "Register number is required for this legal form",
			path: ["registerNumber"],
		},
	);

export type LegalEntityInput = z.infer<typeof legalEntitySchema>;

/**
 * Onboarding schema - create new merchant and first store
 */
export const onboardInputSchema = z.object({
	merchant: z.object({
		name: z.string().min(4).max(100),
		ownerName: z.string().min(2).max(100),
		email: z.string().email(),
		phone: z.string().optional(),
	}),
	store: z.object({
		name: z.string().min(2).max(100),
		street: z.string().min(3).max(200),
		city: z.string().min(2).max(100),
		postalCode: z
			.string()
			.length(5)
			.regex(/^[0-9]{5}$/),
		country: z.string().min(2).max(100),
		timezone: z.string().default("Europe/Berlin"),
		currency: z.enum(["EUR", "USD", "GBP", "CHF"]).default("EUR"),
	}),
	legalEntity: legalEntitySchema,
});

export type OnboardInput = z.infer<typeof onboardInputSchema>;
