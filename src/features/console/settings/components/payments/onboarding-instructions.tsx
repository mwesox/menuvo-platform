import {
	Building2,
	CreditCard,
	ExternalLink,
	Loader2,
	ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useCreateOnboardingLink } from "../../queries";

interface OnboardingInstructionsProps {
	merchantId: string;
}

export function OnboardingInstructions({
	merchantId,
}: OnboardingInstructionsProps) {
	const { t } = useTranslation("settings");
	const createLink = useCreateOnboardingLink();

	const handleStartOnboarding = () => {
		createLink.mutate({ merchantId });
	};

	const requirements = [
		{
			icon: ShieldCheck,
			titleKey: "payments.onboarding.requirements.identity.title",
			descriptionKey: "payments.onboarding.requirements.identity.description",
		},
		{
			icon: Building2,
			titleKey: "payments.onboarding.requirements.banking.title",
			descriptionKey: "payments.onboarding.requirements.banking.description",
		},
		{
			icon: CreditCard,
			titleKey: "payments.onboarding.requirements.business.title",
			descriptionKey: "payments.onboarding.requirements.business.description",
		},
	] as const;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("payments.onboarding.title")}</CardTitle>
				<CardDescription>
					{t("payments.onboarding.description")}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Why this is needed */}
				<div className="space-y-4">
					<p className="font-medium text-sm">
						{t("payments.onboarding.whyNeeded")}
					</p>
					<div className="grid gap-4 sm:grid-cols-3">
						{requirements.map((req) => (
							<div
								key={req.titleKey}
								className="flex flex-col gap-2 rounded-lg border p-4"
							>
								<req.icon className="size-5 text-primary" />
								<div>
									<p className="font-medium text-sm">{t(req.titleKey)}</p>
									<p className="text-muted-foreground text-xs">
										{t(req.descriptionKey)}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Action buttons */}
				<div className="flex flex-col gap-3 sm:flex-row">
					<Button
						onClick={handleStartOnboarding}
						disabled={createLink.isPending}
					>
						{createLink.isPending ? (
							<>
								<Loader2 className="me-2 size-4 animate-spin" />
								{t("payments.onboarding.redirecting")}
							</>
						) : (
							<>
								{t("payments.onboarding.button")}
								<ExternalLink className="ms-2 size-4" />
							</>
						)}
					</Button>
					<p className="self-center text-muted-foreground text-xs">
						{t("payments.onboarding.skipNote")}
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
