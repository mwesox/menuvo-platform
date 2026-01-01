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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select.tsx";
import { useOnboardingForm } from "../../contexts/form-context.tsx";
import { languages } from "../../validation.ts";

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
						<form.Field name="merchant.name">
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
						<form.Field name="merchant.email">
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
					</div>
					<div className="grid gap-4 sm:grid-cols-2">
						<form.Field name="merchant.phone">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="merchant-phone">
											{t("onboarding:fields.phone")} (
											{t("common:labels.optional")})
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
						<form.Field name="merchant.primaryLanguage">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="primary-language">
											{t("onboarding:fields.primaryLanguage")}
										</FieldLabel>
										<Select
											name={field.name}
											value={field.state.value}
											onValueChange={(value) =>
												field.handleChange(
													value as "en" | "de" | "fr" | "es" | "it",
												)
											}
										>
											<SelectTrigger
												id="primary-language"
												aria-invalid={isInvalid}
											>
												<SelectValue
													placeholder={t(
														"onboarding:placeholders.selectLanguage",
													)}
												/>
											</SelectTrigger>
											<SelectContent>
												{languages.map((lang) => (
													<SelectItem key={lang.value} value={lang.value}>
														{lang.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
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
