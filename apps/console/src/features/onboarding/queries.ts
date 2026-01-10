import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import type { OnboardingFormInput } from "./schemas.ts";

/**
 * Hook for merchant onboarding.
 *
 * Creates a new merchant and their first store via tRPC.
 * Automatically sets authentication cookie on success.
 *
 * Uses tRPC v11 best practices with mutationOptions().
 */
export function useOnboardMerchant() {
	const { t } = useTranslation("onboarding");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	return useMutation({
		...trpc.onboarding.onboard.mutationOptions(),
		// Transform form input to API schema (add defaults for timezone/currency)
		mutationFn: async (input: OnboardingFormInput) => {
			return trpcClient.onboarding.onboard.mutate({
				merchant: input.merchant,
				store: {
					...input.store,
					timezone: "Europe/Berlin",
					currency: "EUR",
				},
			});
		},
		onSuccess: async () => {
			// Invalidate auth queries with correct tRPC query key
			// This ensures the dashboard sees the new merchant after navigation
			await queryClient.invalidateQueries({
				queryKey: trpc.auth.getMerchantOrNull.queryKey(),
			});

			toast.success(t("toast.successTitle"), {
				description: t("toast.successDescription"),
			});
			// Navigation handled by the caller (wizard) after this completes
		},
		onError: (error) => {
			toast.error(t("toast.errorTitle"), {
				description:
					error instanceof Error ? error.message : "An unknown error occurred",
			});
		},
	});
}
