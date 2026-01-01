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
import type {
	MerchantGeneralInput,
	MerchantLanguageInput,
} from "./validation.ts";

// Query keys
export const merchantKeys = {
	all: ["merchants"] as const,
	detail: (merchantId: number) => ["merchants", merchantId] as const,
};

// Query options factories
export const merchantQueries = {
	detail: (merchantId: number) =>
		queryOptions({
			queryKey: merchantKeys.detail(merchantId),
			queryFn: () => getMerchant({ data: { merchantId } }),
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
