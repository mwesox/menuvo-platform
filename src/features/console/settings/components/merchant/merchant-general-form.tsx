import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card.tsx";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input.tsx";
import { merchantQueries, useUpdateMerchantGeneral } from "../../queries.ts";
import { merchantGeneralSchema } from "../../schemas";

interface MerchantGeneralFormProps {
	merchantId: string;
}

export function MerchantGeneralForm({ merchantId }: MerchantGeneralFormProps) {
	const { t } = useTranslation("settings");
	const { t: tForms } = useTranslation("forms");
	const { t: tCommon } = useTranslation("common");
	const { data: merchant } = useSuspenseQuery(
		merchantQueries.detail(merchantId),
	);
	const updateMutation = useUpdateMerchantGeneral();

	const form = useForm({
		defaultValues: {
			name: merchant.name,
			email: merchant.email,
			phone: merchant.phone ?? "",
		},
		validators: {
			onSubmit: merchantGeneralSchema,
		},
		onSubmit: async ({ value }) => {
			await updateMutation.mutateAsync({
				merchantId,
				...value,
			});
		},
	});

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
