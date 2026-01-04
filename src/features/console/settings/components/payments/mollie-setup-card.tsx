import { Check, CreditCard, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useSetupMolliePaymentAccount } from "../../queries";

interface MollieSetupCardProps {
	merchantId: number;
}

/**
 * Card shown when merchant hasn't set up Mollie payments yet.
 * Displays benefits and setup button that starts the Mollie onboarding flow.
 */
export function MollieSetupCard({ merchantId }: MollieSetupCardProps) {
	const { t } = useTranslation("settings");
	const setupMollie = useSetupMolliePaymentAccount();

	const handleSetup = () => {
		setupMollie.mutate({ merchantId });
	};

	const benefits = [
		"payments.mollie.benefits.paypal",
		"payments.mollie.benefits.ideal",
		"payments.mollie.benefits.lowFees",
		"payments.mollie.benefits.fastPayout",
	] as const;

	return (
		<Card className="border-dashed">
			<CardHeader className="text-center">
				<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
					<CreditCard className="h-6 w-6 text-primary" />
				</div>
				<CardTitle>{t("payments.mollie.setup.title")}</CardTitle>
				<CardDescription className="max-w-md mx-auto">
					{t("payments.mollie.setup.description")}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-3">
					<p className="text-sm font-medium text-center">
						{t("payments.mollie.setup.benefitsTitle")}
					</p>
					<ul className="space-y-2">
						{benefits.map((key) => (
							<li key={key} className="flex items-center gap-2 text-sm">
								<Check className="h-4 w-4 text-green-600 shrink-0" />
								<span>{t(key)}</span>
							</li>
						))}
					</ul>
				</div>

				{/* PayPal badge highlight */}
				<div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
					<svg
						className="h-5 w-5 text-[#003087]"
						viewBox="0 0 24 24"
						fill="currentColor"
						aria-hidden="true"
						role="img"
					>
						<title>PayPal</title>
						<path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 1.994a.768.768 0 0 1 .757-.647h6.833c2.274 0 3.984.586 5.082 1.742.985 1.037 1.465 2.467 1.386 4.132-.026.551-.112 1.145-.263 1.778-.646 2.753-2.277 4.465-4.854 5.093-.626.153-1.309.23-2.032.23H9.857a.953.953 0 0 0-.941.804l-.846 5.326a.768.768 0 0 1-.757.647l-.237.038Z" />
					</svg>
					<span className="text-sm font-medium text-blue-800 dark:text-blue-200">
						{t("payments.mollie.setup.paypalIncluded")}
					</span>
				</div>

				<Button
					onClick={handleSetup}
					disabled={setupMollie.isPending}
					className="w-full"
					size="lg"
				>
					{setupMollie.isPending ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							{t("payments.mollie.setup.creating")}
						</>
					) : (
						t("payments.mollie.setup.button")
					)}
				</Button>
			</CardContent>
		</Card>
	);
}
