import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ChangePlanInput, MerchantGeneralInput } from "./schemas";
import {
	getMerchant,
	updateMerchantGeneral,
} from "./server/merchants.functions.ts";
import {
	createPaymentOnboardingLink,
	getMollieDashboardUrl,
	getMolliePaymentStatus,
	getPaymentStatus,
	refreshMolliePaymentStatus,
	refreshPaymentStatus,
	setupMolliePaymentAccount,
	setupPaymentAccount,
} from "./server/payments.functions.ts";
import {
	cancelMerchantSubscription,
	changeSubscriptionPlan,
	createMerchantBillingPortal,
	getSubscriptionDetails,
	resumeMerchantSubscription,
} from "./server/subscription.functions.ts";

// Query keys
export const merchantKeys = {
	all: ["merchants"] as const,
	detail: (merchantId: number) => ["merchants", merchantId] as const,
	subscription: (merchantId: number) =>
		["merchants", merchantId, "subscription"] as const,
	payment: (merchantId: number) =>
		["merchants", merchantId, "payment"] as const,
	molliePayment: (merchantId: number) =>
		["merchants", merchantId, "mollie-payment"] as const,
};

// Query options factories
export const merchantQueries = {
	// merchantId is obtained from auth context on server
	detail: (merchantId: number) =>
		queryOptions({
			queryKey: merchantKeys.detail(merchantId),
			queryFn: () => getMerchant(),
		}),
};

// merchantId is obtained from auth context on server
export const subscriptionQueries = {
	detail: (merchantId: number) =>
		queryOptions({
			queryKey: merchantKeys.subscription(merchantId),
			queryFn: () => getSubscriptionDetails(),
		}),
};

// merchantId is obtained from auth context on server
export const paymentQueries = {
	status: (merchantId: number) =>
		queryOptions({
			queryKey: merchantKeys.payment(merchantId),
			queryFn: () => getPaymentStatus(),
		}),
};

// Mollie payment queries
export const molliePaymentQueries = {
	status: (merchantId: number) =>
		queryOptions({
			queryKey: merchantKeys.molliePayment(merchantId),
			queryFn: () => getMolliePaymentStatus(),
		}),
};

// Mutation hooks
export function useUpdateMerchantGeneral() {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		// merchantId is for cache invalidation, server gets it from auth context
		mutationFn: (input: MerchantGeneralInput & { merchantId: number }) =>
			updateMerchantGeneral({ data: input }),
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
			changeSubscriptionPlan({ data: input }),
		onSuccess: (data) => {
			// Redirect to Stripe checkout
			if (data.checkoutUrl) {
				window.location.href = data.checkoutUrl;
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
		mutationFn: (input: { merchantId: number; immediately?: boolean }) =>
			cancelMerchantSubscription({
				data: { immediately: input.immediately ?? false },
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
		mutationFn: (_input: { merchantId: number }) =>
			resumeMerchantSubscription(),
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
		mutationFn: (_input: { merchantId: number }) =>
			createMerchantBillingPortal(),
		onSuccess: (data) => {
			if (data.url) {
				window.location.href = data.url;
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
		mutationFn: (_input: { merchantId: number }) => setupPaymentAccount(),
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
		mutationFn: (_input: { merchantId: number }) =>
			createPaymentOnboardingLink(),
		onSuccess: (data) => {
			if (data.url) {
				window.location.href = data.url;
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
		mutationFn: (_input: { merchantId: number }) => refreshPaymentStatus(),
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
		mutationFn: (_input: { merchantId: number }) => setupMolliePaymentAccount(),
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({
				queryKey: merchantKeys.molliePayment(variables.merchantId),
			});
			queryClient.invalidateQueries({
				queryKey: merchantKeys.detail(variables.merchantId),
			});

			// If we got an onboarding URL, open it in a new tab
			// so our app stays open during Mollie onboarding
			if (data.onboardingUrl) {
				window.open(data.onboardingUrl, "_blank");
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
		mutationFn: (_input: { merchantId: number }) =>
			refreshMolliePaymentStatus(),
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
		mutationFn: () => getMollieDashboardUrl(),
		onSuccess: (data) => {
			if (data.dashboardUrl) {
				window.open(data.dashboardUrl, "_blank");
			}
		},
		onError: () => {
			toast.error(t("error.getMollieDashboardUrl"));
		},
	});
}
