import { useCallback, useState } from "react";

export type WizardStep = 1 | 2;

export function useOnboardingWizard() {
	const [currentStep, setCurrentStep] = useState<WizardStep>(1);

	const goToNext = useCallback(() => {
		setCurrentStep((prev) => Math.min(prev + 1, 2) as WizardStep);
	}, []);

	const goToPrevious = useCallback(() => {
		setCurrentStep((prev) => Math.max(prev - 1, 1) as WizardStep);
	}, []);

	const goToStep = useCallback((step: WizardStep) => {
		setCurrentStep(step);
	}, []);

	return {
		currentStep,
		goToNext,
		goToPrevious,
		goToStep,
		isFirstStep: currentStep === 1,
		isLastStep: currentStep === 2,
		totalSteps: 2 as const,
	};
}

export type WizardState = ReturnType<typeof useOnboardingWizard>;
