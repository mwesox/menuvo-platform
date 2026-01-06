import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/ui/logo";
import { OnboardingForm } from "@/features/console/onboarding/components/onboarding-form";

export const Route = createFileRoute("/onboarding")({
	component: OnboardingPage,
});

function OnboardingPage() {
	const { t } = useTranslation("onboarding");

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
			<div className="mx-auto max-w-2xl px-4 py-12">
				<div className="mb-8 text-center">
					<h1 className="flex items-center justify-center gap-2 font-bold text-3xl tracking-tight">
						{t("page.title")}
						<Logo height={66} />
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
