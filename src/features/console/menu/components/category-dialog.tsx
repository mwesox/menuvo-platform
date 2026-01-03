import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog.tsx";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input.tsx";
import { LoadingButton } from "@/components/ui/loading-button";
import { Textarea } from "@/components/ui/textarea.tsx";
import type { Category } from "@/db/schema.ts";
import { getLocalizedContent } from "@/features/console/translations/logic/localization.ts";
import { categoryFormSchema } from "../schemas.ts";

interface CategoryDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	category?: Category | null;
	onSave: (data: { name: string; description?: string }) => Promise<void>;
}

export function CategoryDialog({
	open,
	onOpenChange,
	category,
	onSave,
}: CategoryDialogProps) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const { t: tForms } = useTranslation("forms");
	const isEditing = !!category;

	const form = useForm({
		defaultValues: {
			name: "",
			description: "",
		},
		validators: {
			onSubmit: categoryFormSchema,
		},
		onSubmit: async ({ value }) => {
			await onSave({
				name: value.name,
				description: value.description || undefined,
			});
			onOpenChange(false);
		},
	});

	// Reset form when dialog opens or category changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: form methods are stable, including form causes infinite loop
	useEffect(() => {
		if (open) {
			form.reset();
			if (category) {
				const { name, description } = getLocalizedContent(
					category.translations,
					"de",
					"de",
				);
				form.setFieldValue("name", name);
				form.setFieldValue("description", description ?? "");
			}
		}
	}, [open, category]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<DialogHeader>
						<DialogTitle>
							{isEditing ? t("titles.editCategory") : t("titles.addCategory")}
						</DialogTitle>
						<DialogDescription>
							{isEditing
								? t("dialogs.updateCategoryDescription")
								: t("dialogs.createCategoryDescription")}
						</DialogDescription>
					</DialogHeader>

					<div className="py-4">
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
					</div>

					<DialogFooter>
						<form.Subscribe
							selector={(state) => ({
								isSubmitting: state.isSubmitting,
								canSubmit: state.canSubmit,
							})}
						>
							{({ isSubmitting, canSubmit }) => (
								<>
									<Button
										type="button"
										variant="outline"
										onClick={() => onOpenChange(false)}
									>
										{tCommon("buttons.cancel")}
									</Button>
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
								</>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
