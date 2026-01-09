import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import type { ImportJobStatusResponse } from "./types";

/**
 * Upload a menu file for import.
 */
export function useUploadMenuFile(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const { t } = useTranslation("common");

	return useMutation({
		mutationKey: trpc.import.upload.mutationKey(),
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("storeId", storeId);
			return trpcClient.import.upload.mutate(formData);
		},
		onError: () => {
			toast.error(t("toasts.uploadFailed"));
		},
	});
}

/**
 * Poll for import job status.
 * Polls every 2 seconds while job is processing.
 */
export function useImportJobStatus(jobId: string | null) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();

	return useQuery({
		queryKey: trpc.import.getJobStatus.queryKey({ jobId: jobId ?? "" }),
		queryFn: async () => {
			if (jobId === null) throw new Error("Job ID required");
			const result = await trpcClient.import.getJobStatus.query({ jobId });
			return result as ImportJobStatusResponse;
		},
		enabled: jobId !== null,
		refetchInterval: (query) => {
			const data = query.state.data;
			// Stop polling when job is complete or failed
			if (
				data?.status === "READY" ||
				data?.status === "FAILED" ||
				data?.status === "COMPLETED"
			) {
				return false;
			}
			// Poll every 2 seconds while processing
			return 2000;
		},
		staleTime: 1000,
		select: (data): ImportJobStatusResponse => data as ImportJobStatusResponse,
	});
}

/**
 * Apply selected import changes.
 */
export function useApplyImportChanges(storeId: string) {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("common");

	return useMutation({
		mutationKey: trpc.import.applyChanges.mutationKey(),
		mutationFn: (input: {
			jobId: string;
			selections: Array<{
				type: "category" | "item" | "optionGroup";
				extractedName: string;
				action: "apply" | "skip";
				matchedEntityId?: string;
			}>;
		}) => trpcClient.import.applyChanges.mutate({ ...input, storeId }),
		onSuccess: () => {
			// Invalidate all menu queries to refresh data
			queryClient.invalidateQueries({
				queryKey: trpc.category.list.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.item.listByStore.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.option.listGroups.queryKey({ storeId }),
			});
			toast.success(t("toasts.importApplied"));
		},
		onError: () => {
			toast.error(t("toasts.importFailed"));
		},
	});
}
