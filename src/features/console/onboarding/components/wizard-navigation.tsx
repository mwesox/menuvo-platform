import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import { useOnboardingForm } from "../contexts/form-context.tsx";
import type { WizardState } from "../hooks/use-onboarding-wizard.ts";

// Field names for each step
const MERCHANT_STEP_FIELDS = [
	"merchant.name",
	"merchant.email",
	"merchant.phone",
	"merchant.primaryLanguage",
] as const;

const STORE_STEP_FIELDS = [
	"store.name",
	"store.street",
	"store.city",
	"store.postalCode",
	"store.country",
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

	async function handleNext() {
		const fieldsToValidate: readonly FieldName[] =
			wizard.currentStep === 1 ? MERCHANT_STEP_FIELDS : STORE_STEP_FIELDS;

		// Touch all fields in the current step to show validation errors
		for (const fieldName of fieldsToValidate) {
			form.setFieldMeta(fieldName, (prev) => ({
				...prev,
				isTouched: true,
			}));
		}

		// Validate all fields in the current step
		const validationResults = await Promise.all(
			fieldsToValidate.map((fieldName) =>
				form.validateField(fieldName, "change"),
			),
		);

		// Check if all fields are valid
		const allValid = validationResults.every(
			(result) => result === undefined || result.length === 0,
		);

		if (allValid) {
			wizard.goToNext();
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
					<Button type="submit" size="lg" disabled={isSubmitting}>
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
