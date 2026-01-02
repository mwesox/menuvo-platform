import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
	getMissingTranslationsReport,
	getTranslationStatus,
	updateCategoryTranslations,
	updateItemTranslations,
	updateMerchantLanguages,
	updateOptionChoiceTranslations,
	updateOptionGroupTranslations,
} from "./server/translations.functions.ts";
import type {
	LanguageCode,
	UpdateCategoryTranslationsInput,
	UpdateItemTranslationsInput,
	UpdateOptionChoiceTranslationsInput,
	UpdateOptionGroupTranslationsInput,
} from "./validation.ts";

// Query keys
export const translationKeys = {
	status: (storeId: number, merchantId: number) =>
		["translations", "status", storeId, merchantId] as const,
	missingReport: (
		storeId: number,
		merchantId: number,
		languageCode?: LanguageCode,
	) => ["translations", "missing", storeId, merchantId, languageCode] as const,
};

// Query options factories
export const translationQueries = {
	status: (storeId: number, merchantId: number) =>
		queryOptions({
			queryKey: translationKeys.status(storeId, merchantId),
			queryFn: () => getTranslationStatus({ data: { storeId, merchantId } }),
			enabled: !!storeId && !!merchantId,
		}),

	missingReport: (
		storeId: number,
		merchantId: number,
		languageCode?: LanguageCode,
	) =>
		queryOptions({
			queryKey: translationKeys.missingReport(
				storeId,
				merchantId,
				languageCode,
			),
			queryFn: () =>
				getMissingTranslationsReport({
					data: { storeId, merchantId, languageCode },
				}),
			enabled: !!storeId && !!merchantId,
		}),
};

// Mutation hooks

/**
 * Update merchant's supported languages.
 * All languages are equal - first in array is used as fallback.
 */
export function useUpdateMerchantLanguages(merchantId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			supportedLanguages,
		}: {
			supportedLanguages: LanguageCode[];
		}) =>
			updateMerchantLanguages({
				data: { merchantId, supportedLanguages },
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
 */
export function useUpdateCategoryTranslations(
	storeId: number,
	merchantId: number,
) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateCategoryTranslationsInput) =>
			updateCategoryTranslations({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: translationKeys.status(storeId, merchantId),
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
 */
export function useUpdateItemTranslations(storeId: number, merchantId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateItemTranslationsInput) =>
			updateItemTranslations({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: translationKeys.status(storeId, merchantId),
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
 */
export function useUpdateOptionGroupTranslations(
	storeId: number,
	merchantId: number,
) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateOptionGroupTranslationsInput) =>
			updateOptionGroupTranslations({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: translationKeys.status(storeId, merchantId),
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
 */
export function useUpdateOptionChoiceTranslations(
	storeId: number,
	merchantId: number,
) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateOptionChoiceTranslationsInput) =>
			updateOptionChoiceTranslations({ data: input }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: translationKeys.status(storeId, merchantId),
			});
			toast.success(t("success.translationUpdated", "Translation updated"));
		},
		onError: () => {
			toast.error(t("error.updateTranslation", "Failed to update translation"));
		},
	});
}
