import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpcClient } from "@/lib/trpc";
import type {
	LanguageCode,
	UpdateCategoryTranslationsInput,
	UpdateItemTranslationsInput,
	UpdateOptionChoiceTranslationsInput,
	UpdateOptionGroupTranslationsInput,
} from "./schemas.ts";

// Query keys - merchantId obtained from auth context on server
export const translationKeys = {
	status: (storeId: string) => ["translations", "status", storeId] as const,
	missingReport: (storeId: string, languageCode?: LanguageCode) =>
		["translations", "missing", storeId, languageCode] as const,
};

// Query options factories - merchantId obtained from auth context on server
export const translationQueries = {
	status: (storeId: string) =>
		queryOptions({
			queryKey: translationKeys.status(storeId),
			queryFn: () => trpcClient.translation.getStatus.query({ storeId }),
			enabled: !!storeId,
		}),

	missingReport: (storeId: string, languageCode?: LanguageCode) =>
		queryOptions({
			queryKey: translationKeys.missingReport(storeId, languageCode),
			queryFn: () =>
				trpcClient.translation.getMissingReport.query({
					storeId,
					languageCode,
				}),
			enabled: !!storeId,
		}),
};

// Mutation hooks

/**
 * Update merchant's supported languages.
 * All languages are equal - first in array is used as fallback.
 * merchantId is obtained from auth context on server.
 */
export function useUpdateMerchantLanguages() {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			supportedLanguages,
		}: {
			supportedLanguages: LanguageCode[];
		}) =>
			trpcClient.merchant.updateLanguages.mutate({
				supportedLanguages,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["merchants"] });
			queryClient.invalidateQueries({ queryKey: ["translations"] });
			toast.success(t("success.languagesUpdated", "Languages updated"));
		},
		onError: () => {
			toast.error(t("error.updateLanguages", "Failed to update languages"));
		},
	});
}

/**
 * Update translations for a category.
 * Only storeId needed for cache invalidation.
 */
export function useUpdateCategoryTranslations(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateCategoryTranslationsInput) =>
			trpcClient.translation.updateCategory.mutate(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: translationKeys.status(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: ["categories"],
			});
			toast.success(t("success.translationUpdated", "Translation updated"));
		},
		onError: () => {
			toast.error(t("error.updateTranslation", "Failed to update translation"));
		},
	});
}

/**
 * Update translations for an item.
 * Only storeId needed for cache invalidation.
 */
export function useUpdateItemTranslations(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateItemTranslationsInput) =>
			trpcClient.translation.updateItem.mutate(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: translationKeys.status(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: ["items"],
			});
			toast.success(t("success.translationUpdated", "Translation updated"));
		},
		onError: () => {
			toast.error(t("error.updateTranslation", "Failed to update translation"));
		},
	});
}

/**
 * Update translations for an option group.
 * Only storeId needed for cache invalidation.
 */
export function useUpdateOptionGroupTranslations(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateOptionGroupTranslationsInput) =>
			trpcClient.translation.updateOptionGroup.mutate(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: translationKeys.status(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: ["optionGroups"],
			});
			toast.success(t("success.translationUpdated", "Translation updated"));
		},
		onError: () => {
			toast.error(t("error.updateTranslation", "Failed to update translation"));
		},
	});
}

/**
 * Update translations for an option choice.
 * Only storeId needed for cache invalidation.
 */
export function useUpdateOptionChoiceTranslations(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateOptionChoiceTranslationsInput) =>
			trpcClient.translation.updateOptionChoice.mutate(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: translationKeys.status(storeId),
			});
			toast.success(t("success.translationUpdated", "Translation updated"));
		},
		onError: () => {
			toast.error(t("error.updateTranslation", "Failed to update translation"));
		},
	});
}
