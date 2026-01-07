import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
	createOptionChoice,
	createOptionGroup,
	deleteOptionChoice,
	deleteOptionGroup,
	getItemOptions,
	getOptionGroup,
	getOptionGroups,
	saveOptionGroupWithChoices,
	toggleOptionChoiceAvailable,
	toggleOptionGroupActive,
	updateItemOptions,
	updateOptionChoice,
	updateOptionGroup,
} from "./server/options.functions.ts";

// Re-export types for convenience
export type {
	CreateOptionChoiceInput,
	CreateOptionGroupInput,
	SaveOptionGroupWithChoicesInput,
	UpdateItemOptionsInput,
	UpdateOptionChoiceInput,
	UpdateOptionGroupInput,
} from "./options.schemas.ts";

import type {
	CreateOptionChoiceInput,
	CreateOptionGroupInput,
	SaveOptionGroupWithChoicesInput,
	UpdateOptionChoiceInput,
	UpdateOptionGroupInput,
} from "./options.schemas.ts";

// Query keys
export const optionKeys = {
	groups: {
		byStore: (storeId: string) => ["optionGroups", "store", storeId] as const,
		detail: (optionGroupId: string) =>
			["optionGroups", "detail", optionGroupId] as const,
	},
	choices: {
		byGroup: (optionGroupId: string) =>
			["optionChoices", "group", optionGroupId] as const,
	},
	itemOptions: {
		byItem: (itemId: string) => ["itemOptions", "item", itemId] as const,
	},
};

// Option group query options factories
export const optionGroupQueries = {
	byStore: (storeId: string) =>
		queryOptions({
			queryKey: optionKeys.groups.byStore(storeId),
			queryFn: () => getOptionGroups({ data: { storeId } }),
			enabled: !!storeId,
		}),

	detail: (optionGroupId: string) =>
		queryOptions({
			queryKey: optionKeys.groups.detail(optionGroupId),
			queryFn: () => getOptionGroup({ data: { optionGroupId } }),
		}),
};

// Item options query options factory
export const itemOptionQueries = {
	byItem: (itemId: string) =>
		queryOptions({
			queryKey: optionKeys.itemOptions.byItem(itemId),
			queryFn: () => getItemOptions({ data: { itemId } }),
		}),
};

// Option group mutation hooks
export function useCreateOptionGroup(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Omit<CreateOptionGroupInput, "storeId">) =>
			createOptionGroup({ data: { storeId, ...input } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: optionKeys.groups.byStore(storeId),
			});
			toast.success(t("success.optionGroupCreated"));
		},
		onError: () => {
			toast.error(t("error.createOptionGroup"));
		},
	});
}

export function useUpdateOptionGroup(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			optionGroupId,
			...data
		}: UpdateOptionGroupInput & { optionGroupId: string }) =>
			updateOptionGroup({ data: { optionGroupId, ...data } }),
		onSuccess: (updatedGroup) => {
			queryClient.setQueryData(
				optionKeys.groups.detail(updatedGroup.id),
				updatedGroup,
			);
			queryClient.invalidateQueries({
				queryKey: optionKeys.groups.byStore(storeId),
			});
			toast.success(t("success.optionGroupUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateOptionGroup"));
		},
	});
}

export function useToggleOptionGroupActive(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			optionGroupId,
			isActive,
		}: {
			optionGroupId: string;
			isActive: boolean;
		}) => toggleOptionGroupActive({ data: { optionGroupId, isActive } }),
		onSuccess: (optionGroup) => {
			queryClient.invalidateQueries({
				queryKey: optionKeys.groups.byStore(storeId),
			});
			toast.success(
				optionGroup.isActive
					? t("success.optionGroupShown")
					: t("success.optionGroupHidden"),
			);
		},
		onError: () => {
			toast.error(t("error.updateOptionGroup"));
		},
	});
}

export function useDeleteOptionGroup(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (optionGroupId: string) =>
			deleteOptionGroup({ data: { optionGroupId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: optionKeys.groups.byStore(storeId),
			});
			toast.success(t("success.optionGroupDeleted"));
		},
		onError: () => {
			toast.error(t("error.deleteOptionGroup"));
		},
	});
}

export function useSaveOptionGroupWithChoices(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Omit<SaveOptionGroupWithChoicesInput, "storeId">) =>
			saveOptionGroupWithChoices({ data: { storeId, ...input } }),
		onSuccess: (savedGroup) => {
			queryClient.setQueryData(
				optionKeys.groups.detail(savedGroup.id),
				savedGroup,
			);
			queryClient.invalidateQueries({
				queryKey: optionKeys.groups.byStore(storeId),
			});
			toast.success(t("success.optionGroupSaved"));
		},
		onError: () => {
			toast.error(t("error.saveOptionGroup"));
		},
	});
}

// Option choice mutation hooks
export function useCreateOptionChoice(optionGroupId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (input: Omit<CreateOptionChoiceInput, "optionGroupId">) =>
			createOptionChoice({ data: { optionGroupId, ...input } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: optionKeys.groups.detail(optionGroupId),
			});
			toast.success(t("success.optionChoiceCreated"));
		},
		onError: () => {
			toast.error(t("error.createOptionChoice"));
		},
	});
}

export function useUpdateOptionChoice(optionGroupId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			optionChoiceId,
			...data
		}: UpdateOptionChoiceInput & { optionChoiceId: string }) =>
			updateOptionChoice({ data: { optionChoiceId, ...data } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: optionKeys.groups.detail(optionGroupId),
			});
			toast.success(t("success.optionChoiceUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateOptionChoice"));
		},
	});
}

export function useToggleOptionChoiceAvailable(optionGroupId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			optionChoiceId,
			isAvailable,
		}: {
			optionChoiceId: string;
			isAvailable: boolean;
		}) =>
			toggleOptionChoiceAvailable({ data: { optionChoiceId, isAvailable } }),
		onSuccess: (optionChoice) => {
			queryClient.invalidateQueries({
				queryKey: optionKeys.groups.detail(optionGroupId),
			});
			toast.success(
				optionChoice.isAvailable
					? t("success.optionChoiceAvailable")
					: t("success.optionChoiceUnavailable"),
			);
		},
		onError: () => {
			toast.error(t("error.updateOptionChoice"));
		},
	});
}

export function useDeleteOptionChoice(optionGroupId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (optionChoiceId: string) =>
			deleteOptionChoice({ data: { optionChoiceId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: optionKeys.groups.detail(optionGroupId),
			});
			toast.success(t("success.optionChoiceDeleted"));
		},
		onError: () => {
			toast.error(t("error.deleteOptionChoice"));
		},
	});
}

// Item options mutation hook
export function useUpdateItemOptions(itemId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (optionGroupIds: string[]) =>
			updateItemOptions({ data: { itemId, optionGroupIds } }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: optionKeys.itemOptions.byItem(itemId),
			});
			toast.success(t("success.itemOptionsUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateItemOptions"));
		},
	});
}
