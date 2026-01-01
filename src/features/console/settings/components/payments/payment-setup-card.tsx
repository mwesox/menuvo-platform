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
import { useSetupPaymentAccount } from "../../queries";

interface PaymentSetupCardProps {
	merchantId: number;
}

export function PaymentSetupCard({ merchantId }: PaymentSetupCardProps) {
	const { t } = useTranslation("settings");
	const setupPayment = useSetupPaymentAccount();

	const handleSetup = () => {
		setupPayment.mutate({ merchantId });
	};

	const benefits = [
		"payments.setup.benefits.trial",
		"payments.setup.benefits.payments",
		"payments.setup.benefits.payouts",
	] as const;

	return (
		<Card className="border-dashed">
			<CardHeader className="text-center">
				<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
					<CreditCard className="h-6 w-6 text-primary" />
				</div>
				<CardTitle>{t("payments.setup.title")}</CardTitle>
				<CardDescription className="max-w-md mx-auto">
					{t("payments.setup.description")}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-3">
					<p className="text-sm font-medium text-center">
						{t("payments.setup.benefitsTitle")}
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

				<Button
					onClick={handleSetup}
					disabled={setupPayment.isPending}
					className="w-full"
					size="lg"
				>
					{setupPayment.isPending ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
