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

export function PaymentsPage() {
	const { t } = useTranslation("settings");
	const search = useSearch({ from: "/settings/payments" });
	const navigate = useNavigate();

	// Mollie payment status
	const { data: mollieStatus } = useSuspenseQuery(
		molliePaymentQueries.status(),
	);

	const refreshMollieStatus = useRefreshMolliePaymentStatus();

	// Track if we've already triggered a refresh for this URL to prevent double-triggers
	const hasTriggeredRefresh = useRef(false);

	// Auto-refresh status when returning from Mollie
	useEffect(() => {
		const shouldRefresh = search.from === "mollie" || search.refresh;

		if (shouldRefresh && !hasTriggeredRefresh.current) {
			hasTriggeredRefresh.current = true;
			refreshMollieStatus.mutate();

			// Clear URL params to prevent re-triggering on page refresh
			navigate({ to: "/settings/payments", search: {}, replace: true });
		}
	}, [search.from, search.refresh, navigate, refreshMollieStatus]);

	// Reset the ref when URL params are cleared
	useEffect(() => {
		if (!search.from && !search.refresh) {
			hasTriggeredRefresh.current = false;
		}
	}, [search.from, search.refresh]);

	const hasMollieAccount = !!mollieStatus.organizationId;

	return (
		<div className="space-y-6">
			<PageActionBar
				breadcrumbs={[
					{ label: t("hub.pageTitle"), href: "/settings" },
					{ label: t("hub.payments.title") },
				]}
			/>

			{!hasMollieAccount ? (
				<MollieSetupCard />
			) : (
				<MollieStatusCard
					mollieStatus={{
						mollieOrganizationId: mollieStatus.organizationId,
						mollieProfileId: mollieStatus.profileId,
						mollieOnboardingStatus: mollieStatus.onboardingStatus ?? null,
						mollieCanReceivePayments: mollieStatus.canReceivePayments,
						mollieCanReceiveSettlements: mollieStatus.canReceiveSettlements,
					}}
				/>
			)}
		</div>
	);
}
