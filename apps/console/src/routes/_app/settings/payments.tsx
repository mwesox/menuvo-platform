import { Heading, VStack } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod/v4";
import { ConsoleError } from "@/features/components/console-error";
import { MollieSetupCard } from "@/features/settings/components/payments/mollie-setup-card";
import { MollieStatusCard } from "@/features/settings/components/payments/mollie-status-card";
import { useTRPC } from "@/lib/trpc";

const searchSchema = z.object({
	// For Mollie callback
	from: z.literal("mollie").optional(),
	refresh: z.boolean().optional(),
	error: z.string().optional(),
});

export const Route = createFileRoute("/_app/settings/payments")({
	validateSearch: searchSchema,
	component: PaymentsSettingsPage,
	errorComponent: ConsoleError,
});

function PaymentsSettingsPage() {
	const { from, refresh } = Route.useSearch();
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
		const shouldRefresh = from === "mollie" || refresh;

		if (shouldRefresh && !hasTriggeredRefresh.current) {
			hasTriggeredRefresh.current = true;
			void refreshMollieStatus();

			// Clear URL params to prevent re-triggering on page refresh
			navigate({
				to: "/settings/payments",
				replace: true,
			});
		}
	}, [from, refresh, navigate, refreshMollieStatus]);

	// Reset the ref when URL params are cleared
	useEffect(() => {
		if (!from && !refresh) {
			hasTriggeredRefresh.current = false;
		}
	}, [from, refresh]);

	// Early return after all hooks are called
	if (!mollieStatus) {
		return null;
	}

	const hasMollieAccount = !!mollieStatus.organizationId;

	return (
		<VStack gap="8" align="stretch" w="full">
			<Heading as="h1" textStyle="pageTitle">
				{t("titles.payments")}
			</Heading>
			{!hasMollieAccount ? (
				<MollieSetupCard />
			) : (
				<MollieStatusCard mollieStatus={mollieStatus} />
			)}
		</VStack>
	);
}
