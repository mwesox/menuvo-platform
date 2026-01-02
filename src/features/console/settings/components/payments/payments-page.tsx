import { useSuspenseQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
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
			<PageActionBar
				backHref="/console/settings"
				backLabel={t("navigation.backToSettings")}
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
