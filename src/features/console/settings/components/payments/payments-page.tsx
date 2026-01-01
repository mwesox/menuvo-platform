import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { paymentQueries, useRefreshPaymentStatus } from "../../queries";
import { OnboardingInstructions } from "./onboarding-instructions";
import { PaymentSetupCard } from "./payment-setup-card";
import { PaymentStatusCard } from "./payment-status-card";

interface PaymentsPageProps {
	merchantId: number;
}

export function PaymentsPage({ merchantId }: PaymentsPageProps) {
	const { t } = useTranslation("settings");
	const search = useSearch({ from: "/console/settings/payments" });
	const { data: paymentStatus } = useSuspenseQuery(
		paymentQueries.status(merchantId),
	);
	const refreshStatus = useRefreshPaymentStatus();

	// Auto-refresh status when returning from Stripe
	useEffect(() => {
		if (search.from === "stripe" || search.refresh) {
			refreshStatus.mutate({ merchantId });
		}
	}, [search.from, search.refresh, merchantId, refreshStatus.mutate]);

	const hasPaymentAccount = !!paymentStatus.paymentAccountId;

	return (
		<div className="space-y-6">
			<Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
				<Link to="/console/settings">
					<ArrowLeft className="mr-2 h-4 w-4" />
					{t("navigation.backToSettings")}
				</Link>
			</Button>

			<PageHeader
				title={t("payments.pageTitle")}
				description={t("payments.pageDescription")}
			/>

			{!hasPaymentAccount ? (
				<PaymentSetupCard merchantId={merchantId} />
			) : (
				<div className="space-y-6">
					<PaymentStatusCard
						paymentStatus={paymentStatus}
						merchantId={merchantId}
					/>

					{!paymentStatus.paymentOnboardingComplete && (
						<OnboardingInstructions merchantId={merchantId} />
					)}
				</div>
			)}
		</div>
	);
}
