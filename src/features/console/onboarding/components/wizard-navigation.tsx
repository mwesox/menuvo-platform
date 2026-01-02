import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import { useOnboardingForm } from "../contexts/form-context.tsx";
import type { WizardState } from "../hooks/use-onboarding-wizard.ts";

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

interface WizardNavigationProps {
	wizard: WizardState;
	isSubmitting: boolean;
}

export function WizardNavigation({
	wizard,
	isSubmitting,
}: WizardNavigationProps) {
	const { t } = useTranslation("onboarding");
	const form = useOnboardingForm();

	// Validate fields with onBlur validators (used for both steps)
	async function validateCurrentStep(): Promise<boolean> {
		const fieldsToValidate: readonly FieldName[] =
			wizard.currentStep === 1 ? MERCHANT_STEP_FIELDS : STORE_STEP_FIELDS;

		// Trigger onBlur validation for all fields in current step
		const validationResults = await Promise.all(
			fieldsToValidate.map((fieldName) =>
				form.validateField(fieldName, "blur"),
			),
		);

		// Check if all fields are valid (no errors returned)
		return validationResults.every(
			(result) => result === undefined || result.length === 0,
		);
	}

	async function handleNext() {
		const allValid = await validateCurrentStep();
		if (allValid) {
			wizard.goToNext();
		}
	}

	async function handleSubmit() {
		const allValid = await validateCurrentStep();
		if (allValid) {
			await form.handleSubmit();
		}
	}

	return (
		<div className="mt-8 flex justify-between">
			<div>
				{!wizard.isFirstStep && (
					<Button type="button" variant="outline" onClick={wizard.goToPrevious}>
						{t("actions.previous")}
					</Button>
				)}
			</div>

			<div>
				{wizard.isLastStep ? (
					<Button
						type="button"
						size="lg"
						disabled={isSubmitting}
						onClick={handleSubmit}
					>
						{isSubmitting
							? t("actions.creatingAccount")
							: t("actions.createAccount")}
					</Button>
				) : (
					<Button type="button" size="lg" onClick={handleNext}>
						{t("actions.continue")}
					</Button>
				)}
			</div>
		</div>
	);
}
