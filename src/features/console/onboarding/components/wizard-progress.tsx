import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils.ts";

interface WizardProgressProps {
	currentStep: number;
	totalSteps: number;
}

export function WizardProgress({
	currentStep,
	totalSteps,
}: WizardProgressProps) {
	const { t } = useTranslation("onboarding");

	const steps = [
		{ step: 1, label: t("steps.businessInfo") },
		{ step: 2, label: t("steps.storeInfo") },
	];

	return (
		<div className="mb-8">
			<div className="flex items-center justify-center">
				{steps.map(({ step, label }, index) => {
					const isActive = step === currentStep;
					const isCompleted = step < currentStep;

					return (
						<div key={step} className="flex items-center">
							<div className="flex flex-col items-center">
								<div
									className={cn(
										"flex size-10 items-center justify-center rounded-full border-2 font-medium text-sm transition-colors",
										isActive &&
											"border-primary bg-primary text-primary-foreground",
										isCompleted &&
											"border-primary bg-primary text-primary-foreground",
										!isActive &&
											!isCompleted &&
											"border-muted-foreground/30 text-muted-foreground",
									)}
									aria-current={isActive ? "step" : undefined}
								>
									{isCompleted ? (
										<Check className="size-5" aria-hidden="true" />
									) : (
										step
									)}
								</div>
								<span
									className={cn(
										"mt-2 font-medium text-sm",
										isActive && "text-foreground",
										isCompleted && "text-foreground",
										!isActive && !isCompleted && "text-muted-foreground",
									)}
								>
									{label}
								</span>
							</div>

							{index < totalSteps - 1 && (
								<div
									className={cn(
										"mx-4 h-0.5 w-16 transition-colors",
										step < currentStep ? "bg-primary" : "bg-muted",
									)}
									aria-hidden="true"
								/>
							)}
						</div>
					);
				})}
			</div>

			<p className="mt-4 text-center text-muted-foreground text-sm">
				{t("descriptions.businessInfo", { returnObjects: false })}
			</p>
		</div>
	);
}
