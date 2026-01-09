import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@menuvo/ui";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSetupPaymentAccount } from "../../queries";

export function PaymentSetupCard() {
	const { t } = useTranslation("settings");
	const setupPayment = useSetupPaymentAccount();

	const handleSetup = () => {
		const returnUrl = `${window.location.origin}/settings/payments?from=stripe`;
		const refreshUrl = `${window.location.origin}/settings/payments?refresh=true`;
		setupPayment.mutate({ returnUrl, refreshUrl });
	};

	const benefits = [
		"payments.setup.benefits.trial",
		"payments.setup.benefits.payments",
		"payments.setup.benefits.payouts",
	] as const;

	return (
		<Card className="border-dashed">
			<CardHeader className="text-center">
				<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
					<CreditCard className="size-6 text-primary" />
				</div>
				<CardTitle>{t("payments.setup.title")}</CardTitle>
				<CardDescription className="mx-auto max-w-md">
					{t("payments.setup.description")}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-3">
					<p className="text-center font-medium text-sm">
						{t("payments.setup.benefitsTitle")}
					</p>
					<ul className="space-y-2">
						{benefits.map((key) => (
							<li key={key} className="flex items-center gap-2 text-sm">
								<Check className="size-4 shrink-0 text-green-600" />
								<span>{t(key)}</span>
							</li>
						))}
					</ul>
				</div>

				<Button
					onClick={handleSetup}
					disabled={setupPayment.isPending}
					className="w-full"
					size="lg"
				>
					{setupPayment.isPending ? (
						<>
							<Loader2 className="me-2 size-4 animate-spin" />
							{t("payments.setup.creating")}
						</>
					) : (
						t("payments.setup.button")
					)}
				</Button>
			</CardContent>
		</Card>
	);
}
