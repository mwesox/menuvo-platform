import { OnboardingFormProvider } from "../contexts/form-context.tsx";
import { OnboardingWizard } from "./onboarding-wizard.tsx";

export function OnboardingForm() {
	return (
		<OnboardingFormProvider>
			<OnboardingWizard />
		</OnboardingFormProvider>
	);
}
