import type { Category } from "@menuvo/db/schema";
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
	LoadingButton,
	Textarea,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getLocalizedContent } from "@/features/translations/logic/localization";
import { useCreateCategory, useUpdateCategory } from "../queries";
import {
	type CategoryFormInput,
	categoryFormSchema,
	formToTranslations,
} from "../schemas";

interface CategoryFormProps {
	storeId: string;
	category?: Category;
}

export function CategoryForm({ storeId, category }: CategoryFormProps) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const { t: tForms } = useTranslation("forms");
	const navigate = useNavigate();

	const isEditing = !!category;
	const language = "de"; // Primary language

	const createMutation = useCreateCategory(storeId);
	const updateMutation = useUpdateCategory(storeId);

	const form = useForm({
		defaultValues: {
			name: "",
			description: "",
		} satisfies CategoryFormInput,
		validators: {
			onSubmit: categoryFormSchema,
		},
		onSubmit: async ({ value }) => {
			const translations = formToTranslations(
				value,
				language,
				category?.translations ?? {},
			);

			if (isEditing && category) {
				await updateMutation.mutateAsync({
					categoryId: category.id,
					translations: translations as any, // TODO: Fix type mismatch
				});
			} else {
				await createMutation.mutateAsync({
					storeId,
					translations: translations as any,
				});
			}

			// Navigate back to categories list
			navigate({
				to: "/menu",
				search: { storeId },
			});
		},
	});

	// Populate form when editing
	// biome-ignore lint/correctness/useExhaustiveDependencies: Only run when category changes
	useEffect(() => {
		if (category) {
			const { name, description } = getLocalizedContent(
				category.translations,
				language,
				language,
			);
			form.setFieldValue("name", name);
			form.setFieldValue("description", description ?? "");
		}
	}, [category]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{isEditing ? t("titles.editCategory") : t("titles.addCategory")}
				</CardTitle>
				<CardDescription>
					{isEditing
						? t("dialogs.updateCategoryDescription")
						: t("dialogs.createCategoryDescription")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<FieldGroup>
						<form.Field name="name">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="category-name">
											{tForms("fields.name")} *
										</FieldLabel>
										<Input
											id="category-name"
											name={field.name}
											placeholder={t("placeholders.categoryName")}
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

						<form.Field name="description">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="category-description">
											{tForms("fields.description")}
										</FieldLabel>
										<Textarea
											id="category-description"
											name={field.name}
											placeholder={t("placeholders.categoryDescription")}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											rows={3}
											aria-invalid={isInvalid}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
					</FieldGroup>

					<div className="mt-6 flex justify-end gap-3">
						<Button type="button" variant="outline" asChild>
							<Link to="/menu" search={{ storeId }}>
								{tCommon("buttons.cancel")}
							</Link>
						</Button>
						<form.Subscribe
							selector={(state) => ({
								isSubmitting: state.isSubmitting,
								canSubmit: state.canSubmit,
							})}
						>
							{({ isSubmitting, canSubmit }) => (
								<LoadingButton
									type="submit"
									disabled={!canSubmit}
									isLoading={isSubmitting}
									loadingText={
										isEditing
											? tCommon("states.saving")
											: tCommon("states.creating")
									}
								>
									{isEditing
										? tCommon("buttons.saveChanges")
										: t("buttons.createCategory")}
								</LoadingButton>
							)}
						</form.Subscribe>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
