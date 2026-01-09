import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
	const navigate = useNavigate();
	const { t } = useTranslation("onboarding");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();

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
		onSuccess: () => {
			toast.success(t("toast.successTitle"), {
				description: t("toast.successDescription"),
			});
			navigate({ to: "/" });
		},
		onError: (error) => {
			toast.error(t("toast.errorTitle"), {
				description:
					error instanceof Error ? error.message : "An unknown error occurred",
			});
		},
	});
}
