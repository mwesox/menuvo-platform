import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	molliePaymentQueries,
	paymentQueries,
	useRefreshMolliePaymentStatus,
	useRefreshPaymentStatus,
} from "../../queries";
import { MollieSetupCard } from "./mollie-setup-card";
import { MollieStatusCard } from "./mollie-status-card";
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

	// Stripe payment status
	const { data: stripeStatus } = useSuspenseQuery(
		paymentQueries.status(merchantId),
	);

	// Mollie payment status
	const { data: mollieStatus } = useSuspenseQuery(
		molliePaymentQueries.status(merchantId),
	);

	const refreshStripeStatus = useRefreshPaymentStatus();
	const refreshMollieStatus = useRefreshMolliePaymentStatus();

	// Track if we've already triggered a refresh for this URL to prevent double-triggers
	const hasTriggeredRefresh = useRef(false);

	// Auto-refresh status when returning from Stripe or Mollie
	useEffect(() => {
		const shouldRefresh =
			search.from === "stripe" || search.from === "mollie" || search.refresh;

		if (shouldRefresh && !hasTriggeredRefresh.current) {
			hasTriggeredRefresh.current = true;

			if (search.from === "mollie") {
				refreshMollieStatus.mutate({ merchantId });
			} else {
				refreshStripeStatus.mutate({ merchantId });
			}

			// Clear URL params to prevent re-triggering on page refresh
			navigate({ to: "/console/settings/payments", search: {}, replace: true });
		}
	}, [
		search.from,
		search.refresh,
		merchantId,
		navigate,
		refreshStripeStatus,
		refreshMollieStatus,
	]);

	// Reset the ref when URL params are cleared
	useEffect(() => {
		if (!search.from && !search.refresh) {
			hasTriggeredRefresh.current = false;
		}
	}, [search.from, search.refresh]);

	const hasStripeAccount = !!stripeStatus.paymentAccountId;
	const hasMollieAccount = !!mollieStatus.mollieOrganizationId;

	const isLoading =
		refreshStripeStatus.isPending || refreshMollieStatus.isPending;

	// Show loading skeleton while refresh is in progress
	if (isLoading) {
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

			<Tabs defaultValue="mollie" className="space-y-6">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="mollie" className="flex items-center gap-2">
						{t("payments.tabs.mollie")}
						{hasMollieAccount &&
							mollieStatus.mollieOnboardingStatus === "completed" && (
								<span className="h-2 w-2 rounded-full bg-green-500" />
							)}
					</TabsTrigger>
					<TabsTrigger value="stripe" className="flex items-center gap-2">
						{t("payments.tabs.stripe")}
						{hasStripeAccount && stripeStatus.paymentOnboardingComplete && (
							<span className="h-2 w-2 rounded-full bg-green-500" />
						)}
					</TabsTrigger>
				</TabsList>

				{/* Mollie Tab */}
				<TabsContent value="mollie" className="space-y-6">
					{!hasMollieAccount ? (
						<MollieSetupCard merchantId={merchantId} />
					) : (
						<MollieStatusCard
							mollieStatus={mollieStatus}
							merchantId={merchantId}
						/>
					)}
				</TabsContent>

				{/* Stripe Tab */}
				<TabsContent value="stripe" className="space-y-6">
					{!hasStripeAccount ? (
						<PaymentSetupCard merchantId={merchantId} />
					) : (
						<div className="space-y-6">
							<PaymentStatusCard
								paymentStatus={stripeStatus}
								merchantId={merchantId}
							/>

							{!stripeStatus.paymentOnboardingComplete && (
								<OnboardingInstructions merchantId={merchantId} />
							)}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

function PaymentStatusSkeleton() {
	return (
		<div className="space-y-6">
			{/* Tabs Skeleton */}
			<Skeleton className="h-10 w-full" />

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
