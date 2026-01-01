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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select.tsx";
import {
	storeQueries,
	useUpdateStore,
} from "@/features/console/stores/queries.ts";
import { countries, storeDetailsSchema } from "../validation.ts";

interface StoreDetailsFormProps {
	storeId: number;
}

export function StoreDetailsForm({ storeId }: StoreDetailsFormProps) {
	const { t } = useTranslation("stores");
	const { t: tForms } = useTranslation("forms");
	const { t: tCommon } = useTranslation("common");
	const { data: store } = useSuspenseQuery(storeQueries.detail(storeId));
	const updateMutation = useUpdateStore();

	const form = useForm({
		defaultValues: {
			name: store.name,
			street: store.street ?? "",
			city: store.city ?? "",
			postalCode: store.postalCode ?? "",
			country: store.country ?? "DE",
			phone: store.phone ?? "",
			email: store.email ?? "",
		},
		validators: {
			onSubmit: storeDetailsSchema,
		},
		onSubmit: async ({ value }) => {
			await updateMutation.mutateAsync({
				storeId,
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
					<CardTitle>{t("titles.storeDetails")}</CardTitle>
					<CardDescription>{t("descriptions.storeDetails")}</CardDescription>
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
											{tForms("fields.storeName")} *
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={tForms("placeholders.enterStoreName")}
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

						<form.Field name="street">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{tForms("fields.street")} *
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={tForms("placeholders.enterStreet")}
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

						<div className="grid gap-4 sm:grid-cols-3">
							<form.Field name="city">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												{tForms("fields.city")} *
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												placeholder={tForms("placeholders.enterCity")}
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
							<form.Field name="postalCode">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												{tForms("fields.postalCode")} *
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												placeholder={tForms("placeholders.enterPostalCode")}
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
							<form.Field name="country">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												{tForms("fields.country")} *
											</FieldLabel>
											<Select
												name={field.name}
												value={field.state.value}
												onValueChange={field.handleChange}
											>
												<SelectTrigger id={field.name} aria-invalid={isInvalid}>
													<SelectValue
														placeholder={tForms("placeholders.selectCountry")}
													/>
												</SelectTrigger>
												<SelectContent>
													{countries.map((c) => (
														<SelectItem key={c.value} value={c.value}>
															{c.label}
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

			<Card>
				<CardHeader>
					<CardTitle>{t("labels.contactInfo")}</CardTitle>
					<CardDescription>{t("descriptions.contactSettings")}</CardDescription>
				</CardHeader>
				<CardContent>
					<FieldGroup>
						<div className="grid gap-4 sm:grid-cols-2">
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
							<form.Field name="email">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												{tForms("fields.email")}
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
