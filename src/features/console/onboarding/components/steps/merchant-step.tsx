import { useTranslation } from "react-i18next";
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
import { useOnboardingForm } from "../../contexts/form-context.tsx";
import {
	merchantEmailSchema,
	merchantNameSchema,
	merchantPhoneSchema,
	ownerNameSchema,
	zodValidator,
} from "../../validation.ts";

export function MerchantStep() {
	const { t } = useTranslation(["onboarding", "common"]);
	const form = useOnboardingForm();

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("onboarding:titles.businessDetails")}</CardTitle>
				<CardDescription>
					{t("onboarding:descriptions.businessDetailsInfo")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<FieldGroup>
					<div className="grid gap-4 sm:grid-cols-2">
						<form.Field
							name="merchant.name"
							validators={{ onBlur: zodValidator(merchantNameSchema) }}
						>
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="merchant-name">
											{t("onboarding:fields.businessName")} *
										</FieldLabel>
										<Input
											id="merchant-name"
											name={field.name}
											placeholder={t("onboarding:placeholders.businessName")}
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
						<form.Field
							name="merchant.ownerName"
							validators={{ onBlur: zodValidator(ownerNameSchema) }}
						>
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="merchant-owner-name">
											{t("onboarding:fields.ownerName")} *
										</FieldLabel>
										<Input
											id="merchant-owner-name"
											name={field.name}
											placeholder={t("onboarding:placeholders.ownerName")}
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
					<div className="grid gap-4 sm:grid-cols-2">
						<form.Field
							name="merchant.email"
							validators={{ onBlur: zodValidator(merchantEmailSchema) }}
						>
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="merchant-email">
											{t("onboarding:fields.contactEmail")} *
										</FieldLabel>
										<Input
											id="merchant-email"
											name={field.name}
											type="email"
											placeholder={t("onboarding:placeholders.contactEmail")}
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
						<form.Field
							name="merchant.phone"
							validators={{ onBlur: zodValidator(merchantPhoneSchema) }}
						>
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="merchant-phone">
											{t("onboarding:fields.phone")} *
										</FieldLabel>
										<Input
											id="merchant-phone"
											name={field.name}
											placeholder={t("onboarding:placeholders.phone")}
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
	);
}
