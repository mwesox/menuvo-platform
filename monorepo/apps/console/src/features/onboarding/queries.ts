import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { OnboardingFormInput } from "./schemas.ts";

/**
 * Hook for merchant onboarding.
 *
 * TODO: Implement tRPC procedure for merchant onboarding.
 * This requires a public procedure that:
 * 1. Creates a new merchant record
 * 2. Creates the first store for the merchant
 * 3. Returns credentials or redirect URL for login
 *
 * For now, this is a placeholder that shows an error message.
 */
export function useOnboardMerchant() {
	const navigate = useNavigate();
	const { t } = useTranslation("onboarding");

	return useMutation({
		mutationFn: async (_input: OnboardingFormInput): Promise<void> => {
			// TODO: Replace with tRPC call when onboarding procedure is implemented
			// e.g., trpcClient.auth.onboard.mutate(input)
			throw new Error("Onboarding is not yet implemented via tRPC");
		},
		onSuccess: () => {
			toast.success(t("toast.successTitle"), {
				description: t("toast.successDescription"),
			});
			navigate({ to: "/auth/merchant/login" });
		},
		onError: (error) => {
			toast.error(t("toast.errorTitle"), {
				description:
					error instanceof Error ? error.message : "An unknown error occurred",
			});
		},
	});
}
