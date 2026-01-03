import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { Skeleton } from "@/components/ui/skeleton";
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
	const navigate = useNavigate();
	const { data: paymentStatus } = useSuspenseQuery(
		paymentQueries.status(merchantId),
	);
	const refreshStatus = useRefreshPaymentStatus();

	// Track if we've already triggered a refresh for this URL to prevent double-triggers
	const hasTriggeredRefresh = useRef(false);

	// Auto-refresh status when returning from Stripe
	useEffect(() => {
		const shouldRefresh = search.from === "stripe" || search.refresh;

		if (shouldRefresh && !hasTriggeredRefresh.current) {
			hasTriggeredRefresh.current = true;
			refreshStatus.mutate({ merchantId });

			// Clear URL params to prevent re-triggering on page refresh
			navigate({ to: "/console/settings/payments", search: {}, replace: true });
		}
	}, [search.from, search.refresh, merchantId, navigate, refreshStatus]);

	// Reset the ref when URL params are cleared
	useEffect(() => {
		if (!search.from && !search.refresh) {
			hasTriggeredRefresh.current = false;
		}
	}, [search.from, search.refresh]);

	const hasPaymentAccount = !!paymentStatus.paymentAccountId;

	// Show loading skeleton while refresh is in progress
	if (refreshStatus.isPending) {
		return (
			<div className="space-y-6">
				<PageActionBar
					backHref="/console/settings"
					backLabel={t("navigation.backToSettings")}
				/>
				<PaymentStatusSkeleton />
			</div>
		);
	}

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

function PaymentStatusSkeleton() {
	return (
		<div className="space-y-6">
			{/* Status Card Skeleton */}
			<div className="rounded-lg border bg-card p-6 space-y-4">
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-4 w-64" />
					</div>
					<Skeleton className="h-9 w-24" />
				</div>
				<div className="space-y-3">
					<div className="flex items-center justify-between py-2 border-b">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-4 w-32" />
					</div>
					<div className="flex items-center justify-between py-2 border-b">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-4 w-28" />
					</div>
					<div className="flex items-center justify-between py-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-24" />
					</div>
				</div>
			</div>
		</div>
	);
}
