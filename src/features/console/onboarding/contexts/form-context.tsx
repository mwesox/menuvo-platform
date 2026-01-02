import { useForm } from "@tanstack/react-form";
import { createContext, useContext } from "react";
import { useOnboardMerchant } from "../queries.ts";
import { onboardingFormSchema } from "../validation.ts";

const defaultValues = {
	merchant: {
		name: "",
		email: "",
		phone: "",
		initialLanguage: "de" as "en" | "de" | "fr" | "es" | "it",
	},
	store: {
		name: "",
		street: "",
		city: "",
		postalCode: "",
		country: "",
	},
};

function useCreateOnboardingForm() {
	const onboardMutation = useOnboardMerchant();

	return useForm({
		defaultValues,
		validators: {
			onSubmit: onboardingFormSchema,
		},
		onSubmit: async ({ value }) => {
			await onboardMutation.mutateAsync(value);
		},
	});
}

type OnboardingFormType = ReturnType<typeof useCreateOnboardingForm>;

const OnboardingFormContext = createContext<OnboardingFormType | null>(null);

export function OnboardingFormProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const form = useCreateOnboardingForm();
	return (
		<OnboardingFormContext.Provider value={form}>
			{children}
		</OnboardingFormContext.Provider>
	);
}

export function useOnboardingForm() {
	const form = useContext(OnboardingFormContext);
	if (!form) {
		throw new Error(
			"useOnboardingForm must be used within OnboardingFormProvider",
		);
	}
	return form;
}
