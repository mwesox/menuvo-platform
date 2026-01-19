import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	Input,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { merchantGeneralSchema } from "../../schemas";

export function MerchantGeneralForm() {
	const { t } = useTranslation("settings");
	const { t: tForms } = useTranslation("forms");
	const { t: tCommon } = useTranslation("common");
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
			className="space-y-6"
		>
			<Card>
				<CardHeader>
					<CardTitle>{t("sections.businessInformation")}</CardTitle>
					<CardDescription>
						{t("descriptions.businessInformation")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<FieldGroup>
						<form.Field name="name">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{tForms("fields.businessName")} *
										</FieldLabel>
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
									</Field>
								);
							}}
						</form.Field>

						<div className="grid gap-4 sm:grid-cols-2">
							<form.Field name="email">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												{tForms("fields.email")} *
											</FieldLabel>
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
										</Field>
									);
								}}
							</form.Field>

							<form.Field name="phone">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												{tForms("fields.phone")}
											</FieldLabel>
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
										</Field>
									);
								}}
							</form.Field>
						</div>
					</FieldGroup>
				</CardContent>
			</Card>

			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting
							? tCommon("states.saving")
							: tCommon("buttons.saveChanges")}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
