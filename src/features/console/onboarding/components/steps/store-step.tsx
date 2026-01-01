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

export function StoreStep() {
	const { t } = useTranslation(["onboarding", "common"]);
	const form = useOnboardingForm();

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("onboarding:titles.firstStore")}</CardTitle>
				<CardDescription>
					{t("onboarding:descriptions.firstStoreInfo")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<FieldGroup>
					<form.Field name="store.name">
						{(field) => {
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
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>

					<form.Field name="store.street">
						{(field) => {
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
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>

					<div className="grid gap-4 sm:grid-cols-3">
						<form.Field name="store.city">
							{(field) => {
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
						</form.Field>
						<form.Field name="store.postalCode">
							{(field) => {
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
						</form.Field>
						<form.Field name="store.country">
							{(field) => {
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
						</form.Field>
					</div>
				</FieldGroup>
			</CardContent>
		</Card>
	);
}
