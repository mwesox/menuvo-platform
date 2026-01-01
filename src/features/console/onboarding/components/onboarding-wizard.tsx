import { useOnboardingForm } from "../contexts/form-context.tsx";
import { useOnboardingWizard } from "../hooks/use-onboarding-wizard.ts";
import { MerchantStep } from "./steps/merchant-step.tsx";
import { StoreStep } from "./steps/store-step.tsx";
import { WizardNavigation } from "./wizard-navigation.tsx";
import { WizardProgress } from "./wizard-progress.tsx";

export function OnboardingWizard() {
	const wizard = useOnboardingWizard();
	const form = useOnboardingForm();

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="space-y-6"
		>
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
