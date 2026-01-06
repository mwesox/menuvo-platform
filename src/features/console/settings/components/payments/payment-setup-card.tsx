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
