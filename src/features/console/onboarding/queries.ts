import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { OnboardingFormInput } from "./schemas.ts";
import { onboardMerchant } from "./server/onboarding.functions.ts";

export function useOnboardMerchant() {
	const navigate = useNavigate();
	const { t } = useTranslation("onboarding");

	return useMutation({
		mutationFn: (input: OnboardingFormInput) =>
			onboardMerchant({ data: input }),
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
