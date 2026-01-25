import { Heading, VStack } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod/v4";
import { ConsoleError } from "@/features/components/console-error";
import { PayPalSetupCard } from "@/features/settings/components/payments/paypal-setup-card";
import { PayPalStatusCard } from "@/features/settings/components/payments/paypal-status-card";
import { useTRPC } from "@/lib/trpc";

const searchSchema = z.object({
	// For PayPal callback
	from: z.literal("paypal").optional(),
	refresh: z.boolean().optional(),
	error: z.string().optional(),
});

export const Route = createFileRoute("/_app/settings/payments")({
	validateSearch: searchSchema,
	component: PaymentsSettingsPage,
	errorComponent: ConsoleError,
});

function PaymentsSettingsPage() {
	const { from, refresh, error } = Route.useSearch();
	const { t } = useTranslation("settings");
	const { t: tToasts } = useTranslation("toasts");
	const navigate = useNavigate();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	// PayPal payment status
	const { data: paymentStatus } = useQuery({
		...trpc.payments.getAccountStatus.queryOptions(),
	});

	const refreshPaymentStatus = useCallback(async () => {
		try {
			await queryClient.fetchQuery(
				trpc.payments.getOnboardingStatus.queryOptions(),
			);
			queryClient.invalidateQueries({
				queryKey: trpc.payments.getAccountStatus.queryKey(),
			});
			toast.success(tToasts("success.paymentStatusRefreshed"));
		} catch {
			toast.error(tToasts("error.refreshPaymentStatus"));
		}
	}, [queryClient, tToasts, trpc]);

	// Track if we've already triggered a refresh for this URL to prevent double-triggers
	const hasTriggeredRefresh = useRef(false);

	// Handle error from PayPal
	useEffect(() => {
		if (error && !hasTriggeredRefresh.current) {
			toast.error(tToasts("error.paypalCallback"));
		}
	}, [error, tToasts]);

	// Auto-refresh status when returning from PayPal
	useEffect(() => {
		const shouldRefresh = from === "paypal" || refresh;

		if (shouldRefresh && !hasTriggeredRefresh.current) {
			hasTriggeredRefresh.current = true;
			void refreshPaymentStatus();

			// Clear URL params to prevent re-triggering on page refresh
			navigate({
				to: "/settings/payments",
				replace: true,
			});
		}
	}, [from, refresh, navigate, refreshPaymentStatus]);

	// Reset the ref when URL params are cleared
	useEffect(() => {
		if (!from && !refresh) {
			hasTriggeredRefresh.current = false;
		}
	}, [from, refresh]);

	// Early return after all hooks are called
	if (!paymentStatus) {
		return null;
	}

	const hasPayPalAccount = !!paymentStatus.merchantId;

	return (
		<VStack gap="8" align="stretch" w="full">
			<Heading as="h1" textStyle="pageTitle">
				{t("titles.payments")}
			</Heading>
			{!hasPayPalAccount ? (
				<PayPalSetupCard />
			) : (
				<PayPalStatusCard paymentStatus={paymentStatus} />
			)}
		</VStack>
	);
}
