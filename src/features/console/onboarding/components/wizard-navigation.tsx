import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import type { WizardState } from "../hooks/use-onboarding-wizard.ts";

interface WizardNavigationProps {
	wizard: WizardState;
	isSubmitting: boolean;
}

export function WizardNavigation({
	wizard,
	isSubmitting,
}: WizardNavigationProps) {
	const { t } = useTranslation("onboarding");

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
					<Button type="submit" size="lg">
						{t("actions.continue")}
					</Button>
				)}
			</div>
		</div>
	);
}
