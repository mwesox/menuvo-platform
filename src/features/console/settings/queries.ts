import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
	getMerchant,
	updateMerchantGeneral,
	updateMerchantLanguage,
} from "./server/merchants.functions.ts";
import {
	createPaymentOnboardingLink,
	getPaymentStatus,
	refreshPaymentStatus,
	setupPaymentAccount,
} from "./server/payments.functions.ts";
import {
	cancelMerchantSubscription,
	changeSubscriptionPlan,
	createMerchantBillingPortal,
	getSubscriptionDetails,
	resumeMerchantSubscription,
} from "./server/subscription.functions.ts";
import type {
	CancelSubscriptionInput,
	ChangePlanInput,
	MerchantGeneralInput,
	MerchantLanguageInput,
} from "./validation";

// Query keys
export const merchantKeys = {
	all: ["merchants"] as const,
	detail: (merchantId: number) => ["merchants", merchantId] as const,
	subscription: (merchantId: number) =>
		["merchants", merchantId, "subscription"] as const,
	payment: (merchantId: number) =>
		["merchants", merchantId, "payment"] as const,
};

// Query options factories
export const merchantQueries = {
	detail: (merchantId: number) =>
		queryOptions({
			queryKey: merchantKeys.detail(merchantId),
			queryFn: () => getMerchant({ data: { merchantId } }),
		}),
};

export const subscriptionQueries = {
	detail: (merchantId: number) =>
		queryOptions({
			queryKey: merchantKeys.subscription(merchantId),
			queryFn: () => getSubscriptionDetails({ data: { merchantId } }),
		}),
};

export const paymentQueries = {
	status: (merchantId: number) =>
		queryOptions({
			queryKey: merchantKeys.payment(merchantId),
			queryFn: () => getPaymentStatus({ data: { merchantId } }),
		}),
};

// Mutation hooks
export function useUpdateMerchantGeneral() {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: MerchantGeneralInput & { merchantId: number }) =>
			updateMerchantGeneral({ data: input }),
		onSuccess: (updatedMerchant) => {
			queryClient.setQueryData(
				merchantKeys.detail(updatedMerchant.id),
				updatedMerchant,
			);
			toast.success(t("success.settingsSaved"));
		},
		onError: () => {
			toast.error(t("error.saveSettings"));
		},
	});
}

export function useUpdateMerchantLanguage() {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: MerchantLanguageInput & { merchantId: number }) =>
			updateMerchantLanguage({ data: input }),
		onSuccess: (updatedMerchant) => {
			queryClient.setQueryData(
				merchantKeys.detail(updatedMerchant.id),
				updatedMerchant,
			);
			toast.success(t("success.languageUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateLanguage"));
		},
	});
}

// Subscription mutation hooks
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
		mutationFn: (input: CancelSubscriptionInput) =>
			cancelMerchantSubscription({ data: input }),
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
		mutationFn: (input: { merchantId: number }) =>
			resumeMerchantSubscription({ data: input }),
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
		mutationFn: (input: { merchantId: number }) =>
			createMerchantBillingPortal({ data: input }),
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
		mutationFn: (input: { merchantId: number }) =>
			setupPaymentAccount({ data: input }),
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
		mutationFn: (input: { merchantId: number }) =>
			createPaymentOnboardingLink({ data: input }),
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
		mutationFn: (input: { merchantId: number }) =>
			refreshPaymentStatus({ data: input }),
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
