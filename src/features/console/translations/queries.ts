import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { updateMerchantLanguages } from "@/features/console/settings/server/merchants.functions";
import type {
	LanguageCode,
	UpdateCategoryTranslationsInput,
	UpdateItemTranslationsInput,
	UpdateOptionChoiceTranslationsInput,
	UpdateOptionGroupTranslationsInput,
} from "./schemas.ts";
import {
	getMissingTranslationsReport,
	getTranslationStatus,
	updateCategoryTranslations,
	updateItemTranslations,
	updateOptionChoiceTranslations,
	updateOptionGroupTranslations,
} from "./server/translations.functions.ts";

// Query keys - merchantId obtained from auth context on server
export const translationKeys = {
	status: (storeId: number) => ["translations", "status", storeId] as const,
	missingReport: (storeId: number, languageCode?: LanguageCode) =>
		["translations", "missing", storeId, languageCode] as const,
};

// Query options factories - merchantId obtained from auth context on server
export const translationQueries = {
	status: (storeId: number) =>
		queryOptions({
			queryKey: translationKeys.status(storeId),
			queryFn: () => getTranslationStatus({ data: { storeId } }),
			enabled: !!storeId,
		}),

	missingReport: (storeId: number, languageCode?: LanguageCode) =>
		queryOptions({
			queryKey: translationKeys.missingReport(storeId, languageCode),
			queryFn: () =>
				getMissingTranslationsReport({
					data: { storeId, languageCode },
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
			updateMerchantLanguages({
				data: { supportedLanguages },
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
export function useUpdateCategoryTranslations(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateCategoryTranslationsInput) =>
			updateCategoryTranslations({ data: input }),
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
export function useUpdateItemTranslations(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateItemTranslationsInput) =>
			updateItemTranslations({ data: input }),
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
export function useUpdateOptionGroupTranslations(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateOptionGroupTranslationsInput) =>
			updateOptionGroupTranslations({ data: input }),
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
export function useUpdateOptionChoiceTranslations(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: UpdateOptionChoiceTranslationsInput) =>
			updateOptionChoiceTranslations({ data: input }),
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
