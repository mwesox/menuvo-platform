/**
 * Onboarding Domain
 *
 * Exports onboarding router, service, schemas, and types.
 */

export type { IOnboardingService } from "./interface.js";
export { type OnboardingRouter, onboardingRouter } from "./router.js";
export {
	LEGAL_FORMS_REQUIRING_REGISTER,
	type LegalEntityInput,
	type LegalForm,
	legalEntitySchema,
	legalFormEnum,
	type SignupInput,
	signupInputSchema,
} from "./schemas.js";
export { OnboardingService } from "./service.js";
export type { OnboardInput, OnboardResult } from "./types.js";
