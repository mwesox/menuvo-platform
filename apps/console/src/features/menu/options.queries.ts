/**
 * Menu options (option groups & choices) queries and mutations using tRPC
 *
 * Migrated from TanStack Start server functions to tRPC client calls.
 * Uses the tRPC v11 pattern with queryOptions().
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpc, useTRPC, useTRPCClient } from "@/lib/trpc";

// Re-export types for convenience
export type {
	CreateOptionChoiceInput,
	CreateOptionGroupInput,
	SaveOptionGroupWithChoicesInput,
	UpdateItemOptionsInput,
	UpdateOptionChoiceInput,
	UpdateOptionGroupInput,
} from "./options.schemas";

import type {
	CreateOptionChoiceInput,
	CreateOptionGroupInput,
	SaveOptionGroupWithChoicesInput,
	UpdateOptionChoiceInput,
	UpdateOptionGroupInput,
} from "./options.schemas";

// Option group query options factories
export const optionGroupQueries = {
	byStore: (storeId: string) =>
		trpc.option.listGroups.queryOptions({ storeId }),
	detail: (optionGroupId: string) =>
		trpc.option.getGroup.queryOptions({ optionGroupId }),
};

// Item options query options factory
export const itemOptionQueries = {
	byItem: (itemId: string) =>
		trpc.option.getItemOptions.queryOptions({ itemId }),
};

// Option group mutation hooks
export function useCreateOptionGroup(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.option.createGroup.mutationKey(),
		mutationFn: (input: Omit<CreateOptionGroupInput, "storeId">) =>
			trpcClient.option.createGroup.mutate({ storeId, ...input }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.option.listGroups.queryKey({ storeId }),
			});
			toast.success(t("success.optionGroupCreated"));
		},
		onError: () => {
			toast.error(t("error.createOptionGroup"));
		},
	});
}

export function useUpdateOptionGroup(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.option.updateGroup.mutationKey(),
		mutationFn: ({
			optionGroupId,
			...data
		}: UpdateOptionGroupInput & { optionGroupId: string }) =>
			trpcClient.option.updateGroup.mutate({ optionGroupId, ...data }),
		onSuccess: (updatedGroup) => {
			queryClient.invalidateQueries({
				queryKey: trpc.option.getGroup.queryKey({
					optionGroupId: updatedGroup.id,
				}),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.option.listGroups.queryKey({ storeId }),
			});
			toast.success(t("success.optionGroupUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateOptionGroup"));
		},
	});
}

export function useToggleOptionGroupActive(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.option.toggleGroupActive.mutationKey(),
		mutationFn: ({
			optionGroupId,
			isActive,
		}: {
			optionGroupId: string;
			isActive: boolean;
		}) =>
			trpcClient.option.toggleGroupActive.mutate({ optionGroupId, isActive }),
		onSuccess: (optionGroup) => {
			queryClient.invalidateQueries({
				queryKey: trpc.option.listGroups.queryKey({ storeId }),
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
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.option.deleteGroup.mutationKey(),
		mutationFn: (optionGroupId: string) =>
			trpcClient.option.deleteGroup.mutate({ optionGroupId }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.option.listGroups.queryKey({ storeId }),
			});
			toast.success(t("success.optionGroupDeleted"));
		},
		onError: () => {
			toast.error(t("error.deleteOptionGroup"));
		},
	});
}

export function useSaveOptionGroupWithChoices(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.option.saveGroupWithChoices.mutationKey(),
		mutationFn: (input: Omit<SaveOptionGroupWithChoicesInput, "storeId">) =>
			trpcClient.option.saveGroupWithChoices.mutate({ storeId, ...input }),
		onSuccess: (savedGroup) => {
			queryClient.invalidateQueries({
				queryKey: trpc.option.getGroup.queryKey({
					optionGroupId: savedGroup.id,
				}),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.option.listGroups.queryKey({ storeId }),
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
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.option.createChoice.mutationKey(),
		mutationFn: (input: Omit<CreateOptionChoiceInput, "optionGroupId">) =>
			trpcClient.option.createChoice.mutate({ optionGroupId, ...input }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.option.getGroup.queryKey({ optionGroupId }),
			});
			toast.success(t("success.optionChoiceCreated"));
		},
		onError: () => {
			toast.error(t("error.createOptionChoice"));
		},
	});
}

export function useUpdateOptionChoice(optionGroupId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.option.updateChoice.mutationKey(),
		mutationFn: ({
			optionChoiceId,
			...data
		}: UpdateOptionChoiceInput & { optionChoiceId: string }) =>
			trpcClient.option.updateChoice.mutate({ optionChoiceId, ...data }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.option.getGroup.queryKey({ optionGroupId }),
			});
			toast.success(t("success.optionChoiceUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateOptionChoice"));
		},
	});
}

export function useToggleOptionChoiceAvailable(optionGroupId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.option.toggleChoiceAvailable.mutationKey(),
		mutationFn: ({
			optionChoiceId,
			isAvailable,
		}: {
			optionChoiceId: string;
			isAvailable: boolean;
		}) =>
			trpcClient.option.toggleChoiceAvailable.mutate({
				optionChoiceId,
				isAvailable,
			}),
		onSuccess: (optionChoice) => {
			queryClient.invalidateQueries({
				queryKey: trpc.option.getGroup.queryKey({ optionGroupId }),
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
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.option.deleteChoice.mutationKey(),
		mutationFn: (optionChoiceId: string) =>
			trpcClient.option.deleteChoice.mutate({ optionChoiceId }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.option.getGroup.queryKey({ optionGroupId }),
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
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		mutationKey: trpc.option.updateItemOptions.mutationKey(),
		mutationFn: (optionGroupIds: string[]) =>
			trpcClient.option.updateItemOptions.mutate({ itemId, optionGroupIds }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.option.getItemOptions.queryKey({ itemId }),
			});
			toast.success(t("success.itemOptionsUpdated"));
		},
		onError: () => {
			toast.error(t("error.updateItemOptions"));
		},
	});
}
