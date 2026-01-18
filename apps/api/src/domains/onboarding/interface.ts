/**
 * Onboarding Service Interface
 *
 * Defines the contract for onboarding operations.
 */

import type { OnboardInput, OnboardResult } from "./types.js";

/**
 * Onboarding service interface
 */
export interface IOnboardingService {
	/**
	 * Onboard a new merchant with their first store
	 * Creates merchant and store atomically in a transaction
	 *
	 * @throws ConflictError if merchant email already exists
	 * @throws ValidationError if creation fails
	 */
	onboard(input: OnboardInput): Promise<OnboardResult>;
}
