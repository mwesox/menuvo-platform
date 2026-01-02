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
import { generateSlug } from "../../logic/slug.ts";
import {
	storeCitySchema,
	storeNameSchema,
	storePostalCodeSchema,
	storeStreetSchema,
	zodValidator,
} from "../../validation.ts";

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
					<form.Field
						name="store.name"
						validators={{ onBlur: zodValidator(storeNameSchema) }}
					>
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

					<form.Subscribe selector={(state) => state.values.store.name}>
						{(storeName) => {
							const slug = generateSlug(storeName);
							return (
								<Field>
									<FieldLabel htmlFor="store-slug">
										{t("onboarding:fields.storeSlug")}
									</FieldLabel>
									<Input
										id="store-slug"
										value={slug}
										placeholder={t("onboarding:placeholders.storeSlug")}
										readOnly
										className="bg-muted text-muted-foreground cursor-not-allowed"
									/>
								</Field>
							);
						}}
					</form.Subscribe>

					<form.Field
						name="store.street"
						validators={{ onBlur: zodValidator(storeStreetSchema) }}
					>
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
						<form.Field
							name="store.city"
							validators={{ onBlur: zodValidator(storeCitySchema) }}
						>
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
						<form.Field
							name="store.postalCode"
							validators={{ onBlur: zodValidator(storePostalCodeSchema) }}
						>
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
											maxLength={5}
											aria-invalid={isInvalid}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
						<Field>
							<FieldLabel htmlFor="store-country">
								{t("onboarding:fields.country")}
							</FieldLabel>
							<Input
								id="store-country"
								value="Deutschland"
								readOnly
								className="bg-muted text-muted-foreground cursor-not-allowed"
							/>
						</Field>
					</div>
				</FieldGroup>
			</CardContent>
		</Card>
	);
}
