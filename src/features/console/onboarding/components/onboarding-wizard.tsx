import type { FormEvent } from "react";
import { useOnboardingForm } from "../contexts/form-context.tsx";
import { useOnboardingWizard } from "../hooks/use-onboarding-wizard.ts";
import { MerchantStep } from "./steps/merchant-step.tsx";
import { StoreStep } from "./steps/store-step.tsx";
import { WizardNavigation } from "./wizard-navigation.tsx";
import { WizardProgress } from "./wizard-progress.tsx";

// Field names for each step
const MERCHANT_STEP_FIELDS = [
	"merchant.name",
	"merchant.ownerName",
	"merchant.email",
	"merchant.phone",
] as const;

const STORE_STEP_FIELDS = [
	"store.name",
	"store.street",
	"store.city",
	"store.postalCode",
] as const;

type FieldName =
	| (typeof MERCHANT_STEP_FIELDS)[number]
	| (typeof STORE_STEP_FIELDS)[number];

export function OnboardingWizard() {
	const wizard = useOnboardingWizard();
	const form = useOnboardingForm();

	async function validateCurrentStep(): Promise<boolean> {
		const fieldsToValidate: readonly FieldName[] =
			wizard.currentStep === 1 ? MERCHANT_STEP_FIELDS : STORE_STEP_FIELDS;

		const validationResults = await Promise.all(
			fieldsToValidate.map((fieldName) =>
				form.validateField(fieldName, "blur"),
			),
		);

		return validationResults.every(
			(result) => result === undefined || result.length === 0,
		);
	}

	async function handleFormSubmit(e: FormEvent) {
		e.preventDefault();

		const allValid = await validateCurrentStep();
		if (!allValid) return;

		if (wizard.isLastStep) {
			await form.handleSubmit();
		} else {
			wizard.goToNext();
		}
	}

	return (
		<form onSubmit={handleFormSubmit} className="space-y-6">
			<WizardProgress
				currentStep={wizard.currentStep}
				totalSteps={wizard.totalSteps}
			/>

			{wizard.currentStep === 1 && <MerchantStep />}
			{wizard.currentStep === 2 && <StoreStep />}

			<WizardNavigation
				wizard={wizard}
				isSubmitting={form.state.isSubmitting}
			/>
		</form>
	);
}
