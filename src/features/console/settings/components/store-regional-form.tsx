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
import { currencies, storeRegionalSchema, timezones } from "../validation.ts";

interface StoreRegionalFormProps {
	storeId: number;
}

export function StoreRegionalForm({ storeId }: StoreRegionalFormProps) {
	const { t } = useTranslation("settings");
	const { t: tForms } = useTranslation("forms");
	const { t: tCommon } = useTranslation("common");
	const { data: store } = useSuspenseQuery(storeQueries.detail(storeId));
	const updateMutation = useUpdateStore();

	const form = useForm({
		defaultValues: {
			timezone: store.timezone,
			currency: store.currency as "EUR" | "USD" | "GBP" | "CHF",
		},
		validators: {
			onSubmit: storeRegionalSchema,
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
					<CardTitle>{t("sections.regionalSettings")}</CardTitle>
					<CardDescription>
						{t("descriptions.regionalSettings")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<FieldGroup>
						<div className="grid gap-4 sm:grid-cols-2">
							<form.Field name="timezone">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												{tForms("fields.timezone")}
											</FieldLabel>
											<Select
												name={field.name}
												value={field.state.value}
												onValueChange={field.handleChange}
											>
												<SelectTrigger id={field.name} aria-invalid={isInvalid}>
													<SelectValue
														placeholder={tForms("placeholders.selectTimezone")}
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
							</form.Field>
							<form.Field name="currency">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<Field data-invalid={isInvalid}>
											<FieldLabel htmlFor={field.name}>
												{tForms("fields.currency")}
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
												<SelectTrigger id={field.name} aria-invalid={isInvalid}>
													<SelectValue
														placeholder={tForms("placeholders.selectCurrency")}
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
