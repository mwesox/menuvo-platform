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
	getOptionGroup,
	getOptionGroups,
	toggleOptionChoiceAvailable,
	toggleOptionGroupActive,
	updateItemOptions,
	updateOptionChoice,
	updateOptionGroup,
} from "./server/options.functions";

// Re-export types for convenience
export type {
	CreateOptionChoiceInput,
	CreateOptionGroupInput,
	UpdateItemOptionsInput,
	UpdateOptionChoiceInput,
	UpdateOptionGroupInput,
} from "./options.validation";

import type {
	CreateOptionChoiceInput,
	CreateOptionGroupInput,
	UpdateOptionChoiceInput,
	UpdateOptionGroupInput,
} from "./options.validation";

// Query keys
export const optionKeys = {
	groups: {
		byStore: (storeId: number) => ["optionGroups", "store", storeId] as const,
		detail: (optionGroupId: number) =>
			["optionGroups", "detail", optionGroupId] as const,
	},
	choices: {
		byGroup: (optionGroupId: number) =>
			["optionChoices", "group", optionGroupId] as const,
	},
	itemOptions: {
		byItem: (itemId: number) => ["itemOptions", "item", itemId] as const,
	},
};

// Option group query options factories
export const optionGroupQueries = {
	byStore: (storeId: number) =>
		queryOptions({
			queryKey: optionKeys.groups.byStore(storeId),
			queryFn: () => getOptionGroups({ data: { storeId } }),
			enabled: !!storeId,
		}),

	detail: (optionGroupId: number) =>
		queryOptions({
			queryKey: optionKeys.groups.detail(optionGroupId),
			queryFn: () => getOptionGroup({ data: { optionGroupId } }),
		}),
};

// Option group mutation hooks
export function useCreateOptionGroup(storeId: number) {
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

export function useUpdateOptionGroup(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			optionGroupId,
			...data
		}: UpdateOptionGroupInput & { optionGroupId: number }) =>
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

export function useToggleOptionGroupActive(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			optionGroupId,
			isActive,
		}: {
			optionGroupId: number;
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

export function useDeleteOptionGroup(storeId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (optionGroupId: number) =>
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

// Option choice mutation hooks
export function useCreateOptionChoice(optionGroupId: number) {
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

export function useUpdateOptionChoice(optionGroupId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			optionChoiceId,
			...data
		}: UpdateOptionChoiceInput & { optionChoiceId: number }) =>
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

export function useToggleOptionChoiceAvailable(optionGroupId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: ({
			optionChoiceId,
			isAvailable,
		}: {
			optionChoiceId: number;
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

export function useDeleteOptionChoice(optionGroupId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (optionChoiceId: number) =>
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
export function useUpdateItemOptions(itemId: number) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationFn: (optionGroupIds: number[]) =>
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
