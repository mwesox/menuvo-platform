import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/db/schema";
import { categoryFormSchema } from "../validation";

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
				form.setFieldValue("name", category.name);
				form.setFieldValue("description", category.description ?? "");
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
							<form.Field
								name="name"
								children={(field) => {
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
							/>
							<form.Field
								name="description"
								children={(field) => {
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
							/>
						</FieldGroup>
					</div>

					<DialogFooter>
						<form.Subscribe
							selector={(state) => ({
								isSubmitting: state.isSubmitting,
								canSubmit: state.canSubmit,
							})}
							children={({ isSubmitting, canSubmit }) => (
								<>
									<Button
										type="button"
										variant="outline"
										onClick={() => onOpenChange(false)}
									>
										{tCommon("buttons.cancel")}
									</Button>
									<Button type="submit" disabled={isSubmitting || !canSubmit}>
										{isSubmitting
											? isEditing
												? tCommon("states.saving")
												: tCommon("states.creating")
											: isEditing
												? tCommon("buttons.saveChanges")
												: t("buttons.createCategory")}
									</Button>
								</>
							)}
						/>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
