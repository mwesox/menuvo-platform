import { createFileRoute } from "@tanstack/react-router";
import { OnboardingForm } from "@/features/console/onboarding/components/onboarding-form";

export const Route = createFileRoute("/onboarding")({
	component: OnboardingPage,
});

function OnboardingPage() {
	// The OnboardingForm now handles its own full-screen layout
	return <OnboardingForm />;
}
