import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpc, useTRPC, useTRPCClient } from "@/lib/trpc";
import type {
	LanguageCode,
	UpdateCategoryTranslationsInput,
	UpdateItemTranslationsInput,
	UpdateOptionChoiceTranslationsInput,
	UpdateOptionGroupTranslationsInput,
} from "./schemas.ts";

// Query options factories
export const translationQueries = {
	status: (storeId: string) =>
		trpc.translation.getStatus.queryOptions({ storeId }),
	missingReport: (storeId: string, languageCode?: LanguageCode) =>
		trpc.translation.getMissingReport.queryOptions({ storeId, languageCode }),
};

// Mutation hooks

/**
 * Update merchant's supported languages.
 * All languages are equal - first in array is used as fallback.
 * merchantId is obtained from auth context on server.
 */
export function useUpdateMerchantLanguages() {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.merchant.updateLanguages.mutationKey(),
		mutationFn: ({
			supportedLanguages,
		}: {
			supportedLanguages: LanguageCode[];
		}) =>
			trpcClient.merchant.updateLanguages.mutate({
				supportedLanguages,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.merchant.getCurrent.queryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.translation.getStatus.pathKey(),
			});
			toast.success(t("success.languagesUpdated", "Languages updated"));
		},
		onError: () => {
			toast.error(t("error.updateLanguages", "Failed to update languages"));
		},
	});
}

/**
 * Update translations for a category.
 * Iterates through each language in the translations record.
 */
export function useUpdateCategoryTranslations(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.translation.updateCategory.mutationKey(),
		mutationFn: async (input: UpdateCategoryTranslationsInput) => {
			// Convert batch translations to individual updates
			const updates = Object.entries(input.translations)
				.filter(([, value]) => value?.name)
				.map(([langCode, value]) =>
					trpcClient.translation.updateCategory.mutate({
						categoryId: input.categoryId,
						languageCode: langCode,
						name: value!.name!,
						description: value?.description,
					}),
				);
			const results = await Promise.all(updates);
			return results[0]; // Return first result for success handling
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.translation.getStatus.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.category.list.pathKey(),
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
 * Iterates through each language in the translations record.
 */
export function useUpdateItemTranslations(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.translation.updateItem.mutationKey(),
		mutationFn: async (input: UpdateItemTranslationsInput) => {
			// Convert batch translations to individual updates
			const updates = Object.entries(input.translations)
				.filter(([, value]) => value?.name)
				.map(([langCode, value]) =>
					trpcClient.translation.updateItem.mutate({
						itemId: input.itemId,
						languageCode: langCode,
						name: value!.name!,
						description: value?.description,
					}),
				);
			const results = await Promise.all(updates);
			return results[0]; // Return first result for success handling
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.translation.getStatus.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.item.listByStore.pathKey(),
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
 * Iterates through each language in the translations record.
 */
export function useUpdateOptionGroupTranslations(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.translation.updateOptionGroup.mutationKey(),
		mutationFn: async (input: UpdateOptionGroupTranslationsInput) => {
			// Convert batch translations to individual updates
			const updates = Object.entries(input.translations)
				.filter(([, value]) => value?.name)
				.map(([langCode, value]) =>
					trpcClient.translation.updateOptionGroup.mutate({
						optionGroupId: input.optionGroupId,
						languageCode: langCode,
						name: value!.name!,
					}),
				);
			const results = await Promise.all(updates);
			return results[0]; // Return first result for success handling
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.translation.getStatus.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.option.listGroups.pathKey(),
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
 * Iterates through each language in the translations record.
 */
export function useUpdateOptionChoiceTranslations(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.translation.updateOptionChoice.mutationKey(),
		mutationFn: async (input: UpdateOptionChoiceTranslationsInput) => {
			// Convert batch translations to individual updates
			const updates = Object.entries(input.translations)
				.filter(([, value]) => value?.name)
				.map(([langCode, value]) =>
					trpcClient.translation.updateOptionChoice.mutate({
						optionChoiceId: input.optionChoiceId,
						languageCode: langCode,
						name: value!.name!,
					}),
				);
			const results = await Promise.all(updates);
			return results[0]; // Return first result for success handling
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.translation.getStatus.queryKey({ storeId }),
			});
			toast.success(t("success.translationUpdated", "Translation updated"));
		},
		onError: () => {
			toast.error(t("error.updateTranslation", "Failed to update translation"));
		},
	});
}
