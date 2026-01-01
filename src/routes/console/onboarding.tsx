import { createFileRoute } from "@tanstack/react-router";
import { UtensilsCrossed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { OnboardingForm } from "@/features/console/onboarding/components/onboarding-form";

export const Route = createFileRoute("/console/onboarding")({
	component: OnboardingPage,
});

function OnboardingPage() {
	const { t } = useTranslation("onboarding");

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
			<div className="mx-auto max-w-2xl px-4 py-12">
				<div className="mb-8 text-center">
					<div className="mb-4 flex justify-center">
						<div className="rounded-full bg-zinc-900 p-3 dark:bg-zinc-100">
							<UtensilsCrossed className="h-8 w-8 text-white dark:text-zinc-900" />
						</div>
					</div>
					<h1 className="text-3xl font-bold tracking-tight">
						{t("page.title")}
					</h1>
					<p className="mt-2 text-zinc-600 dark:text-zinc-400">
						{t("page.subtitle")}
					</p>
				</div>

				<OnboardingForm />
			</div>
		</div>
	);
}
