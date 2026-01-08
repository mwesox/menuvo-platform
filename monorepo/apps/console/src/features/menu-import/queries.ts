import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpcClient } from "@/lib/trpc";
import { optionKeys } from "../menu/options.queries";
import { menuKeys } from "../menu/queries";
import type { ApplyImportChangesInput } from "./schemas";
import type { ImportJobStatusResponse } from "./types";

/**
 * Query keys for menu import.
 */
export const importKeys = {
	job: (jobId: string) => ["menuImport", "job", jobId] as const,
};

/**
 * Poll for import job status.
 * Polls every 2 seconds while job is processing.
 */
export function useImportJobStatus(jobId: string | null) {
	return useQuery({
		queryKey: importKeys.job(jobId ?? ""),
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
		select: (data): ImportJobStatusResponse => data,
	});
}

/**
 * Apply selected import changes.
 */
export function useApplyImportChanges(storeId: string) {
	const queryClient = useQueryClient();
	const { t } = useTranslation("common");

	return useMutation({
		mutationFn: (input: ApplyImportChangesInput) =>
			trpcClient.import.applyChanges.mutate(input),
		onSuccess: () => {
			// Invalidate all menu queries to refresh data
			queryClient.invalidateQueries({
				queryKey: menuKeys.categories.byStore(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: menuKeys.items.byStore(storeId),
			});
			queryClient.invalidateQueries({
				queryKey: optionKeys.groups.byStore(storeId),
			});
			toast.success(t("toasts.importApplied"));
		},
		onError: () => {
			toast.error(t("toasts.importFailed"));
		},
	});
}
