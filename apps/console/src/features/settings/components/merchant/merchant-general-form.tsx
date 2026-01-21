import { Field, Input, SimpleGrid, VStack } from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SettingsFormFooter } from "@/components/layout/settings-form-footer";
import { FieldError } from "@/components/ui/field-error";
import { FormSection } from "@/components/ui/form-section";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { merchantGeneralSchema } from "../../schemas";

export function MerchantGeneralForm() {
	const { t } = useTranslation("settings");
	const { t: tForms } = useTranslation("forms");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { data: merchant } = useQuery({
		...trpc.merchant.getCurrent.queryOptions(),
	});

	const updateMutation = useMutation({
		...trpc.merchant.updateGeneral.mutationOptions(),
		// Server gets merchantId from auth context
		mutationFn: (input: { name: string; email: string; phone?: string }) =>
			trpcClient.merchant.updateGeneral.mutate(input),
		onSuccess: (updatedMerchant) => {
			queryClient.setQueryData(
				trpc.merchant.getCurrent.queryKey(),
				updatedMerchant,
			);
			toast.success(tToasts("success.settingsSaved"));
		},
		onError: () => {
			toast.error(tToasts("error.saveSettings"));
		},
	});

	const form = useForm({
		defaultValues: {
			name: merchant?.name ?? "",
			email: merchant?.email ?? "",
			phone: merchant?.phone ?? "",
		},
		validators: {
			onSubmit: merchantGeneralSchema,
		},
		onSubmit: async ({ value }) => {
			await updateMutation.mutateAsync(value);
		},
	});

	if (!merchant) {
		return null;
	}

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
		>
			<VStack layerStyle="settingsContent">
				<FormSection
					title={t("sections.businessInformation")}
					description={t("descriptions.businessInformation")}
				>
					<VStack gap="4" align="stretch">
						<form.Field name="name">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field.Root invalid={isInvalid} required>
										<Field.Label htmlFor={field.name}>
											{tForms("fields.businessName")}
										</Field.Label>
										<Input
											id={field.name}
											name={field.name}
											placeholder={tForms("placeholders.enterBusinessName")}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field.Root>
								);
							}}
						</form.Field>

						<SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
							<form.Field name="email">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field.Root invalid={isInvalid} required>
											<Field.Label htmlFor={field.name}>
												{tForms("fields.email")}
											</Field.Label>
											<Input
												id={field.name}
												name={field.name}
												type="email"
												placeholder={tForms("placeholders.enterEmail")}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field.Root>
									);
								}}
							</form.Field>

							<form.Field name="phone">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field.Root invalid={isInvalid}>
											<Field.Label htmlFor={field.name}>
												{tForms("fields.phone")}
											</Field.Label>
											<Input
												id={field.name}
												name={field.name}
												placeholder={tForms("placeholders.enterPhone")}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												aria-invalid={isInvalid}
											/>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</Field.Root>
									);
								}}
							</form.Field>
						</SimpleGrid>
					</VStack>
				</FormSection>

				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => <SettingsFormFooter isSubmitting={isSubmitting} />}
				</form.Subscribe>
			</VStack>
		</form>
	);
}
