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
import { LoadingButton } from "@/components/ui/loading-button";
import type { Store } from "@/db/schema";
import { storeFormSchema } from "../schemas";
import { createStore, updateStore } from "../server/stores.functions";

interface StoreFormProps {
	store?: Store;
	merchantId: string;
}

export function StoreForm({ store, merchantId }: StoreFormProps) {
	const navigate = useNavigate();
	const { t } = useTranslation("stores");
	const { t: tForms } = useTranslation("forms");
	const { t: tCommon } = useTranslation("common");
	const { t: tToasts } = useTranslation("toasts");
	const isEditing = !!store;

	const form = useForm({
		defaultValues: {
			name: store?.name ?? "",
			street: store?.street ?? "",
			city: store?.city ?? "",
			postalCode: store?.postalCode ?? "",
			country: store?.country ?? "",
			phone: store?.phone ?? "",
			email: store?.email ?? "",
		},
		validators: {
			onSubmit: storeFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				if (isEditing) {
					await updateStore({
						data: {
							storeId: store.id,
							...value,
						},
					});
					toast.success(tToasts("success.storeUpdated"));
				} else {
					await createStore({
						data: {
							merchantId,
							...value,
						},
					});
					toast.success(tToasts("success.storeCreated"));
				}
				navigate({ to: "/console/stores" });
			} catch (_error) {
				toast.error(
					isEditing
						? tToasts("error.updateStore")
						: tToasts("error.createStore"),
				);
			}
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
											{tForms("fields.storeNameRequired")}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={tForms("placeholders.downtownLocation")}
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
											{tForms("fields.streetRequired")}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={tForms("placeholders.mainStreet")}
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
												{tForms("fields.cityRequired")}
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												placeholder={tForms("placeholders.berlin")}
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
												{tForms("fields.postalCodeRequired")}
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												placeholder={tForms("placeholders.postalCode10115")}
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
												{tForms("fields.countryRequired")}
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												placeholder={tForms("placeholders.germany")}
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

			<Card>
				<CardHeader>
					<CardTitle>{t("titles.contactSettings")}</CardTitle>
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
												placeholder={tForms("placeholders.phoneExample")}
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
												placeholder={tForms("placeholders.storeEmail")}
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
					<Field orientation="horizontal">
						<Button
							type="button"
							variant="outline"
							onClick={() => navigate({ to: "/console/stores" })}
						>
							{tCommon("buttons.cancel")}
						</Button>
						<LoadingButton
							type="submit"
							isLoading={isSubmitting}
							loadingText={
								isEditing
									? tCommon("states.updating")
									: tCommon("states.creating")
							}
						>
							{isEditing
								? tCommon("buttons.update")
								: tCommon("buttons.create")}
						</LoadingButton>
					</Field>
				)}
			</form.Subscribe>
		</form>
	);
}
