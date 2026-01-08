import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpcClient } from "@/lib/trpc";
import type { ChangePlanInput, MerchantGeneralInput } from "./schemas";

// Query keys
export const merchantKeys = {
	all: ["merchants"] as const,
	detail: (merchantId: string) => ["merchants", merchantId] as const,
	subscription: (merchantId: string) =>
		["merchants", merchantId, "subscription"] as const,
	payment: (merchantId: string) =>
		["merchants", merchantId, "payment"] as const,
	molliePayment: (merchantId: string) =>
		["merchants", merchantId, "mollie-payment"] as const,
};

// Query options factories
export const merchantQueries = {
	// merchantId is obtained from auth context on server
	detail: (merchantId: string) =>
		queryOptions({
			queryKey: merchantKeys.detail(merchantId),
			queryFn: () => trpcClient.merchant.getCurrent.query(),
		}),
};

// merchantId is obtained from auth context on server
export const subscriptionQueries = {
	detail: (merchantId: string) =>
		queryOptions({
			queryKey: merchantKeys.subscription(merchantId),
			queryFn: () => trpcClient.subscription.getDetails.query(),
		}),
};

// merchantId is obtained from auth context on server
export const paymentQueries = {
	status: (merchantId: string) =>
		queryOptions({
			queryKey: merchantKeys.payment(merchantId),
			queryFn: () => trpcClient.payment.getStripeStatus.query(),
		}),
};

// Mollie payment queries
export const molliePaymentQueries = {
	status: (merchantId: string) =>
		queryOptions({
			queryKey: merchantKeys.molliePayment(merchantId),
			queryFn: () => trpcClient.payment.getMollieStatus.query(),
		}),
};

// Mutation hooks
export function useUpdateMerchantGeneral() {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		// merchantId is for cache invalidation, server gets it from auth context
		mutationFn: (input: MerchantGeneralInput & { merchantId: string }) =>
			trpcClient.merchant.updateGeneral.mutate(input),
		onSuccess: (updatedMerchant, variables) => {
			queryClient.setQueryData(
				merchantKeys.detail(variables.merchantId),
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
	const { t } = useTranslation("toasts");

	return useMutation({
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
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		// merchantId is for cache invalidation, server gets it from auth context
		mutationFn: (input: { merchantId: string; immediately?: boolean }) =>
			trpcClient.subscription.cancel.mutate({
				immediately: input.immediately ?? false,
			}),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: merchantKeys.subscription(variables.merchantId),
			});
			queryClient.invalidateQueries({
				queryKey: merchantKeys.detail(variables.merchantId),
			});
			toast.success(t("success.subscriptionCanceled"));
		},
		onError: () => {
			toast.error(t("error.cancelSubscription"));
		},
	});
}

export function useResumeSubscription() {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		// merchantId is for cache invalidation, server gets it from auth context
		mutationFn: (_input: { merchantId: string }) =>
			trpcClient.subscription.resume.mutate(),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: merchantKeys.subscription(variables.merchantId),
			});
			queryClient.invalidateQueries({
				queryKey: merchantKeys.detail(variables.merchantId),
			});
			toast.success(t("success.subscriptionResumed"));
		},
		onError: () => {
			toast.error(t("error.resumeSubscription"));
		},
	});
}

export function useOpenBillingPortal() {
	const { t } = useTranslation("toasts");

	return useMutation({
		// merchantId is for consistency, server gets it from auth context
		mutationFn: (_input: { merchantId: string; returnUrl: string }) =>
			trpcClient.subscription.createBillingPortal.mutate({
				returnUrl: _input.returnUrl,
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
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		// merchantId is for cache invalidation, server gets it from auth context
		mutationFn: (_input: {
			merchantId: string;
			returnUrl: string;
			refreshUrl: string;
		}) =>
			trpcClient.payment.setupStripeAccount.mutate({
				returnUrl: _input.returnUrl,
				refreshUrl: _input.refreshUrl,
			}),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: merchantKeys.payment(variables.merchantId),
			});
			queryClient.invalidateQueries({
				queryKey: merchantKeys.detail(variables.merchantId),
			});
			toast.success(t("success.paymentAccountCreated"));
		},
		onError: () => {
			toast.error(t("error.setupPaymentAccount"));
		},
	});
}

export function useCreateOnboardingLink() {
	const { t } = useTranslation("toasts");

	return useMutation({
		// merchantId is for consistency, server gets it from auth context
		mutationFn: (_input: {
			merchantId: string;
			returnUrl: string;
			refreshUrl: string;
		}) =>
			trpcClient.payment.createStripeOnboardingLink.mutate({
				returnUrl: _input.returnUrl,
				refreshUrl: _input.refreshUrl,
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
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		// merchantId is for cache invalidation, server gets it from auth context
		mutationFn: (_input: { merchantId: string }) =>
			trpcClient.payment.refreshStripeStatus.mutate(),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: merchantKeys.payment(variables.merchantId),
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
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (_input: { merchantId: string; state?: string }) =>
			trpcClient.payment.setupMollieAccount.mutate({
				state: _input.state,
			}),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({
				queryKey: merchantKeys.molliePayment(variables.merchantId),
			});
			queryClient.invalidateQueries({
				queryKey: merchantKeys.detail(variables.merchantId),
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
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (_input: { merchantId: string }) =>
			trpcClient.payment.refreshMollieStatus.mutate(),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: merchantKeys.molliePayment(variables.merchantId),
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
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: () => trpcClient.payment.getMollieDashboardUrl.query(),
		onSuccess: (data) => {
			// The procedure returns info for API layer to get dashboard URL
			if ("dashboardUrl" in data && data.dashboardUrl) {
				window.open(data.dashboardUrl as string, "_blank");
			}
		},
		onError: () => {
			toast.error(t("error.getMollieDashboardUrl"));
		},
	});
}
