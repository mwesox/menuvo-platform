import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useTRPC } from "@/lib/trpc";
import { MollieSetupCard } from "./mollie-setup-card";
import { MollieStatusCard } from "./mollie-status-card";

interface PaymentsPageProps {
	search: { from?: "mollie"; refresh?: boolean; error?: string };
}

export function PaymentsPage({ search }: PaymentsPageProps) {
	const { t } = useTranslation("settings");
	const { t: tToasts } = useTranslation("toasts");
	const navigate = useNavigate();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	// Mollie payment status
	const { data: mollieStatus } = useQuery({
		...trpc.payments.getMollieStatus.queryOptions(),
	});

	const refreshMollieStatus = useCallback(async () => {
		try {
			await queryClient.fetchQuery(
				trpc.payments.getOnboardingStatus.queryOptions(),
			);
			queryClient.invalidateQueries({
				queryKey: trpc.payments.getMollieStatus.queryKey(),
			});
			toast.success(tToasts("success.paymentStatusRefreshed"));
		} catch {
			toast.error(tToasts("error.refreshPaymentStatus"));
		}
	}, [queryClient, tToasts, trpc]);

	// Track if we've already triggered a refresh for this URL to prevent double-triggers
	const hasTriggeredRefresh = useRef(false);

	// Auto-refresh status when returning from Mollie
	useEffect(() => {
		const shouldRefresh = search.from === "mollie" || search.refresh;

		if (shouldRefresh && !hasTriggeredRefresh.current) {
			hasTriggeredRefresh.current = true;
			void refreshMollieStatus();

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

	// Early return after all hooks are called
	if (!mollieStatus) {
		return null;
	}

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
				<MollieStatusCard mollieStatus={mollieStatus} />
			)}
		</div>
	);
}
