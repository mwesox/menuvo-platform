import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import {
	molliePaymentQueries,
	useRefreshMolliePaymentStatus,
} from "../../queries";
import { MollieSetupCard } from "./mollie-setup-card";
import { MollieStatusCard } from "./mollie-status-card";

// Stripe imports - kept for future use
// import { paymentQueries, useRefreshPaymentStatus } from "../../queries";
// import { OnboardingInstructions } from "./onboarding-instructions";
// import { PaymentSetupCard } from "./payment-setup-card";
// import { PaymentStatusCard } from "./payment-status-card";

interface PaymentsPageProps {
	merchantId: string;
}

export function PaymentsPage({ merchantId }: PaymentsPageProps) {
	const { t } = useTranslation("settings");
	const search = useSearch({ from: "/console/settings/payments" });
	const navigate = useNavigate();

	// Mollie payment status
	const { data: mollieStatus } = useSuspenseQuery(
		molliePaymentQueries.status(merchantId),
	);

	const refreshMollieStatus = useRefreshMolliePaymentStatus();

	// Track if we've already triggered a refresh for this URL to prevent double-triggers
	const hasTriggeredRefresh = useRef(false);

	// Auto-refresh status when returning from Mollie
	useEffect(() => {
		const shouldRefresh = search.from === "mollie" || search.refresh;

		if (shouldRefresh && !hasTriggeredRefresh.current) {
			hasTriggeredRefresh.current = true;
			refreshMollieStatus.mutate({ merchantId });

			// Clear URL params to prevent re-triggering on page refresh
			navigate({ to: "/console/settings/payments", search: {}, replace: true });
		}
	}, [search.from, search.refresh, merchantId, navigate, refreshMollieStatus]);

	// Reset the ref when URL params are cleared
	useEffect(() => {
		if (!search.from && !search.refresh) {
			hasTriggeredRefresh.current = false;
		}
	}, [search.from, search.refresh]);

	const hasMollieAccount = !!mollieStatus.mollieOrganizationId;

	return (
		<div className="space-y-6">
			<PageActionBar
				backHref="/console/settings"
				backLabel={t("navigation.backToSettings")}
			/>

			{!hasMollieAccount ? (
				<MollieSetupCard merchantId={merchantId} />
			) : (
				<MollieStatusCard mollieStatus={mollieStatus} merchantId={merchantId} />
			)}
		</div>
	);
}
