import { useForm } from "@tanstack/react-form";
import { createContext, useContext } from "react";
import { useOnboardMerchant } from "../queries.ts";

const defaultValues = {
	merchant: {
		name: "",
		ownerName: "",
		email: "",
		phone: "",
	},
	store: {
		name: "",
		street: "",
		city: "",
		postalCode: "",
		country: "Deutschland",
	},
};

function useCreateOnboardingForm() {
	const onboardMutation = useOnboardMerchant();

	return useForm({
		defaultValues,
		// Field-level validators are defined on each <form.Field> with onBlur
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
