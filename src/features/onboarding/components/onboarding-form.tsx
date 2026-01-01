import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { onboardMerchant } from "../server/onboarding.functions";
import {
	currencies,
	languages,
	onboardingFormSchema,
	timezones,
} from "../validation";

export function OnboardingForm() {
	const { t } = useTranslation(["onboarding", "common"]);
	const navigate = useNavigate();

	const form = useForm({
		defaultValues: {
			merchant: {
				name: "",
				email: "",
				phone: "",
				primaryLanguage: "en" as "en" | "de" | "fr" | "es" | "it",
			},
			store: {
				name: "",
				street: "",
				city: "",
				postalCode: "",
				country: "",
				timezone: "Europe/Berlin",
				currency: "EUR" as "EUR" | "USD" | "GBP" | "CHF",
			},
		},
		validators: {
			onSubmit: onboardingFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				await onboardMerchant({ data: value });
				toast.success(t("onboarding:toast.successTitle"), {
					description: t("onboarding:toast.successDescription"),
				});
				navigate({ to: "/console" });
			} catch (error) {
				if (error instanceof Error) {
					toast.error(t("onboarding:toast.errorTitle"), {
						description: error.message,
					});
				}
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="space-y-8"
		>
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
								children={(field) => {
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
							/>
							<form.Field
								name="merchant.email"
								children={(field) => {
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
							/>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
							<form.Field
								name="merchant.phone"
								children={(field) => {
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
							/>
							<form.Field
								name="merchant.primaryLanguage"
								children={(field) => {
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
							/>
						</div>
					</FieldGroup>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("onboarding:titles.firstStore")}</CardTitle>
					<CardDescription>
						{t("onboarding:descriptions.firstStoreInfo")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<FieldGroup>
						<form.Field
							name="store.name"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="store-name">
											{t("onboarding:fields.storeName")} *
										</FieldLabel>
										<Input
											id="store-name"
											name={field.name}
											placeholder={t("onboarding:placeholders.storeName")}
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
						/>

						<form.Field
							name="store.street"
							children={(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="store-street">
											{t("onboarding:fields.streetAddress")} *
										</FieldLabel>
										<Input
											id="store-street"
											name={field.name}
											placeholder={t("onboarding:placeholders.streetAddress")}
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
						/>

						<div className="grid gap-4 sm:grid-cols-3">
							<form.Field
								name="store.city"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor="store-city">
												{t("onboarding:fields.city")} *
											</FieldLabel>
											<Input
												id="store-city"
												name={field.name}
												placeholder={t("onboarding:placeholders.city")}
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
							/>
							<form.Field
								name="store.postalCode"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor="store-postal">
												{t("onboarding:fields.postalCode")} *
											</FieldLabel>
											<Input
												id="store-postal"
												name={field.name}
												placeholder={t("onboarding:placeholders.postalCode")}
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
							/>
							<form.Field
								name="store.country"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor="store-country">
												{t("onboarding:fields.country")} *
											</FieldLabel>
											<Input
												id="store-country"
												name={field.name}
												placeholder={t("onboarding:placeholders.country")}
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
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<form.Field
								name="store.timezone"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor="store-timezone">
												{t("onboarding:fields.timezone")}
											</FieldLabel>
											<Select
												name={field.name}
												value={field.state.value}
												onValueChange={field.handleChange}
											>
												<SelectTrigger
													id="store-timezone"
													aria-invalid={isInvalid}
												>
													<SelectValue
														placeholder={t(
															"onboarding:placeholders.selectTimezone",
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													{timezones.map((tz) => (
														<SelectItem key={tz.value} value={tz.value}>
															{tz.label}
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
							/>
							<form.Field
								name="store.currency"
								children={(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor="store-currency">
												{t("onboarding:fields.currency")}
											</FieldLabel>
											<Select
												name={field.name}
												value={field.state.value}
												onValueChange={(value) =>
													field.handleChange(
														value as "EUR" | "USD" | "GBP" | "CHF",
													)
												}
											>
												<SelectTrigger
													id="store-currency"
													aria-invalid={isInvalid}
												>
													<SelectValue
														placeholder={t(
															"onboarding:placeholders.selectCurrency",
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													{currencies.map((curr) => (
														<SelectItem key={curr.value} value={curr.value}>
															{curr.label}
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
							/>
						</div>
					</FieldGroup>
				</CardContent>
			</Card>

			<div className="flex justify-end">
				<form.Subscribe
					selector={(state) => state.isSubmitting}
					children={(isSubmitting) => (
						<Button type="submit" size="lg" disabled={isSubmitting}>
							{isSubmitting
								? t("onboarding:actions.creatingAccount")
								: t("onboarding:actions.createAccount")}
						</Button>
					)}
				/>
			</div>
		</form>
	);
}
