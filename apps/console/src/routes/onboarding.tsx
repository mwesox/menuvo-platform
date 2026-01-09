import { createFileRoute } from "@tanstack/react-router";
import { OnboardingForm } from "@/features/onboarding/components/onboarding-form";

export const Route = createFileRoute("/onboarding")({
	component: OnboardingPage,
});

function OnboardingPage() {
	// The OnboardingForm handles its own full-screen layout
	return <OnboardingForm />;
}
