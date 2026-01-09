import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpc, useTRPC, useTRPCClient } from "@/lib/trpc";
import type { ChangePlanInput, MerchantGeneralInput } from "./schemas";

// Query options factories
export const merchantQueries = {
	detail: () => trpc.merchant.getCurrent.queryOptions(),
};

export const subscriptionQueries = {
	detail: () => trpc.subscription.getDetails.queryOptions(),
};

export const paymentQueries = {
	status: () => trpc.payment.getStripeStatus.queryOptions(),
};

export const molliePaymentQueries = {
	status: () => trpc.payment.getMollieStatus.queryOptions(),
};

// Mutation hooks
export function useUpdateMerchantGeneral() {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.merchant.updateGeneral.mutationKey(),
		// Server gets merchantId from auth context
		mutationFn: (input: MerchantGeneralInput) =>
			trpcClient.merchant.updateGeneral.mutate(input),
		onSuccess: (updatedMerchant) => {
			queryClient.setQueryData(
				trpc.merchant.getCurrent.queryKey(),
				updatedMerchant,
			);
			toast.success(t("success.settingsSaved"));
		},
		onError: () => {
			toast.error(t("error.saveSettings"));
		},
	});
}

// Subscription mutation hooks
// Note: useUpdateMerchantLanguages is exported from translations/queries.ts
export function useChangeSubscriptionPlan() {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.subscription.changePlan.mutationKey(),
		mutationFn: (input: ChangePlanInput) =>
			trpcClient.subscription.changePlan.mutate(input),
		onSuccess: (data) => {
			// Redirect to Stripe checkout if checkoutUrl is returned
			// Note: The tRPC procedure returns info for the API layer to create the checkout
			// The actual redirect URL should come from the API layer
			if ("checkoutUrl" in data && data.checkoutUrl) {
				window.location.href = data.checkoutUrl as string;
			}
		},
		onError: () => {
			toast.error(t("error.changePlan"));
		},
	});
}

export function useCancelSubscription() {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.subscription.cancel.mutationKey(),
		// Server gets merchantId from auth context
		mutationFn: (input: { immediately?: boolean }) =>
			trpcClient.subscription.cancel.mutate({
				immediately: input.immediately ?? false,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.subscription.getDetails.queryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.merchant.getCurrent.queryKey(),
			});
			toast.success(t("success.subscriptionCanceled"));
		},
		onError: () => {
			toast.error(t("error.cancelSubscription"));
		},
	});
}

export function useResumeSubscription() {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.subscription.resume.mutationKey(),
		mutationFn: () => trpcClient.subscription.resume.mutate(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.subscription.getDetails.queryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.merchant.getCurrent.queryKey(),
			});
			toast.success(t("success.subscriptionResumed"));
		},
		onError: () => {
			toast.error(t("error.resumeSubscription"));
		},
	});
}

export function useOpenBillingPortal() {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.subscription.createBillingPortal.mutationKey(),
		mutationFn: (input: { returnUrl: string }) =>
			trpcClient.subscription.createBillingPortal.mutate({
				returnUrl: input.returnUrl,
			}),
		onSuccess: (data) => {
			// The procedure returns info for API layer to create portal session
			// Actual URL should come from API integration
			if ("url" in data && data.url) {
				window.location.href = data.url as string;
			}
		},
		onError: () => {
			toast.error(t("error.openBillingPortal"));
		},
	});
}

// Payment mutation hooks
export function useSetupPaymentAccount() {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.payment.setupStripeAccount.mutationKey(),
		mutationFn: (input: { returnUrl: string; refreshUrl: string }) =>
			trpcClient.payment.setupStripeAccount.mutate({
				returnUrl: input.returnUrl,
				refreshUrl: input.refreshUrl,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.payment.getStripeStatus.queryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.merchant.getCurrent.queryKey(),
			});
			toast.success(t("success.paymentAccountCreated"));
		},
		onError: () => {
			toast.error(t("error.setupPaymentAccount"));
		},
	});
}

export function useCreateOnboardingLink() {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.payment.createStripeOnboardingLink.mutationKey(),
		mutationFn: (input: { returnUrl: string; refreshUrl: string }) =>
			trpcClient.payment.createStripeOnboardingLink.mutate({
				returnUrl: input.returnUrl,
				refreshUrl: input.refreshUrl,
			}),
		onSuccess: (data) => {
			// The procedure returns info for API layer to create onboarding link
			// Actual URL should come from API integration
			if ("url" in data && data.url) {
				window.location.href = data.url as string;
			}
		},
		onError: () => {
			toast.error(t("error.createOnboardingLink"));
		},
	});
}

export function useRefreshPaymentStatus() {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.payment.refreshStripeStatus.mutationKey(),
		mutationFn: () => trpcClient.payment.refreshStripeStatus.mutate(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.payment.getStripeStatus.queryKey(),
			});
			toast.success(t("success.paymentStatusRefreshed"));
		},
		onError: () => {
			toast.error(t("error.refreshPaymentStatus"));
		},
	});
}

// ============================================================================
// MOLLIE PAYMENT HOOKS
// ============================================================================

/**
 * Set up Mollie payment account for a merchant.
 * Creates a Client Link for co-branded onboarding.
 */
export function useSetupMolliePaymentAccount() {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.payment.setupMollieAccount.mutationKey(),
		mutationFn: (input?: { state?: string }) =>
			trpcClient.payment.setupMollieAccount.mutate({
				state: input?.state,
			}),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: trpc.payment.getMollieStatus.queryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.merchant.getCurrent.queryKey(),
			});

			// If we got an onboarding URL, open it in a new tab
			// so our app stays open during Mollie onboarding
			if ("onboardingUrl" in data && data.onboardingUrl) {
				window.open(data.onboardingUrl as string, "_blank");
				toast.success(t("success.mollieOnboardingStarted"));
			} else {
				toast.success(t("success.mollieAccountSetup"));
			}
		},
		onError: () => {
			toast.error(t("error.setupMollieAccount"));
		},
	});
}

/**
 * Refresh Mollie payment status from API.
 */
export function useRefreshMolliePaymentStatus() {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.payment.refreshMollieStatus.mutationKey(),
		mutationFn: () => trpcClient.payment.refreshMollieStatus.mutate(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.payment.getMollieStatus.queryKey(),
			});
			toast.success(t("success.paymentStatusRefreshed"));
		},
		onError: () => {
			toast.error(t("error.refreshPaymentStatus"));
		},
	});
}

/**
 * Get Mollie dashboard URL for completing verification.
 */
export function useGetMollieDashboardUrl() {
	const trpcClient = useTRPCClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: ["payment", "getMollieDashboardUrl"],
		mutationFn: async () => {
			const result = await trpcClient.payment.getMollieDashboardUrl.query();
			return result;
		},
		onSuccess: (data) => {
			// The procedure returns info for API layer to get dashboard URL
			if (data && "dashboardUrl" in data && data.dashboardUrl) {
				window.open(data.dashboardUrl as string, "_blank");
			}
		},
		onError: () => {
			toast.error(t("error.getMollieDashboardUrl"));
		},
	});
}
