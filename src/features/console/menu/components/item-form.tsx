import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import type { Item } from "@/db/schema.ts";
import { ImageUploadField } from "@/features/console/images/components/image-upload-field.tsx";
import { useDisplayLanguage } from "@/features/console/menu/contexts/display-language-context";
import { createItem, updateItem } from "../server/items.functions.ts";
import { updateItemOptions } from "../server/options.functions.ts";
import {
	allergensList,
	formToTranslations,
	itemFormSchema,
	translationsToForm,
} from "../validation.ts";
import { ItemOptionsSelector } from "./item-options-selector.tsx";

interface ItemFormProps {
	item?: Item;
	categoryId: number;
	storeId: number;
	merchantId: number;
	initialOptionGroupIds?: number[];
}

export function ItemForm({
	item,
	categoryId,
	storeId,
	merchantId,
	initialOptionGroupIds = [],
}: ItemFormProps) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const { t: tForms } = useTranslation("forms");
	const navigate = useNavigate();
	const language = useDisplayLanguage();
	const isEditing = !!item;

	const [selectedOptionGroupIds, setSelectedOptionGroupIds] = useState<
		number[]
	>(initialOptionGroupIds);

	// Get form defaults from translations
	const defaultTranslations = translationsToForm(
		item?.translations ?? null,
		language,
	);

	const form = useForm({
		defaultValues: {
			name: defaultTranslations.name,
			description: defaultTranslations.description,
			price: item ? String(item.price / 100) : "",
			imageUrl: item?.imageUrl ?? "",
			allergens: item?.allergens ?? ([] as string[]),
		},
		validators: {
			onSubmit: itemFormSchema,
		},
		onSubmit: async ({ value }) => {
			const priceInCents = Math.round(Number.parseFloat(value.price) * 100);
			const translations = formToTranslations(
				{ name: value.name, description: value.description },
				language,
				item?.translations ?? undefined,
			);

			try {
				let itemId: number;

				if (isEditing) {
					await updateItem({
						data: {
							itemId: item.id,
							translations,
							price: priceInCents,
							imageUrl: value.imageUrl || undefined,
							allergens: value.allergens,
						},
					});
					itemId = item.id;
				} else {
					const newItem = await createItem({
						data: {
							categoryId,
							storeId,
							translations,
							price: priceInCents,
							imageUrl: value.imageUrl || undefined,
							allergens: value.allergens,
						},
					});
					itemId = newItem.id;
				}

				// Save item options
				await updateItemOptions({
					data: { itemId, optionGroupIds: selectedOptionGroupIds },
				});

				toast.success(
					isEditing
						? t("messages.itemUpdatedSuccess")
						: t("messages.itemCreatedSuccess"),
				);
				navigate({
					to: "/console/menu",
					search: { storeId, tab: "items" as const },
				});
			} catch {
				toast.error(
					isEditing
						? t("messages.itemUpdateFailed")
						: t("messages.itemCreationFailed"),
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
			<Tabs defaultValue="details">
				<TabsList>
					<TabsTrigger value="details">{t("titles.itemDetails")}</TabsTrigger>
					<TabsTrigger value="media">{t("labels.itemImage")}</TabsTrigger>
					<TabsTrigger value="allergens">{t("titles.allergens")}</TabsTrigger>
					<TabsTrigger value="options">{t("titles.options")}</TabsTrigger>
				</TabsList>

				<TabsContent value="details">
					<Card>
						<CardHeader>
							<CardTitle>{t("titles.itemDetails")}</CardTitle>
							<CardDescription>
								{t("descriptions.itemDetailsCard")}
							</CardDescription>
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
													{tForms("fields.name")} *
												</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													placeholder={t("placeholders.itemName")}
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
												<FieldLabel htmlFor={field.name}>
													{tForms("fields.description")}
												</FieldLabel>
												<Textarea
													id={field.name}
													name={field.name}
													placeholder={t("placeholders.itemDescription")}
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

								<form.Field name="price">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid} className="max-w-xs">
												<FieldLabel htmlFor={field.name}>
													{tForms("fields.price")} *
												</FieldLabel>
												<div className="relative">
													<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
														€
													</span>
													<Input
														id={field.name}
														name={field.name}
														type="number"
														step="0.01"
														min="0"
														placeholder="0.00"
														className="pl-7"
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
													/>
												</div>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										);
									}}
								</form.Field>
							</FieldGroup>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="media">
					<Card>
						<CardHeader>
							<CardTitle>{t("labels.itemImage")}</CardTitle>
							<CardDescription>
								{t("descriptions.itemDetailsCard")}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form.Field name="imageUrl">
								{(field) => {
									return (
										<ImageUploadField
											value={field.state.value || undefined}
											onChange={(url) => field.handleChange(url || "")}
											merchantId={merchantId}
											imageType="item_image"
											aspectRatio={4 / 3}
										/>
									);
								}}
							</form.Field>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="allergens">
					<Card>
						<CardHeader>
							<CardTitle>{t("titles.allergens")}</CardTitle>
							<CardDescription>
								{t("descriptions.allergensCard")}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form.Field name="allergens" mode="array">
								{(field) => {
									const isInvalid =
										field.state.meta.isTouched && !field.state.meta.isValid;
									return (
										<FieldSet>
											<FieldLegend className="sr-only">Allergens</FieldLegend>
											<FieldGroup data-slot="checkbox-group">
												<div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
													{allergensList.map((allergen) => (
														<Field
															key={allergen.value}
															orientation="horizontal"
															data-invalid={isInvalid}
														>
															<Checkbox
																id={`allergen-${allergen.value}`}
																checked={field.state.value.includes(
																	allergen.value,
																)}
																onCheckedChange={(checked) => {
																	if (checked) {
																		field.pushValue(allergen.value);
																	} else {
																		const index = field.state.value.indexOf(
																			allergen.value,
																		);
																		if (index > -1) {
																			field.removeValue(index);
																		}
																	}
																}}
															/>
															<FieldLabel
																htmlFor={`allergen-${allergen.value}`}
																className="font-normal"
															>
																{allergen.label}
															</FieldLabel>
														</Field>
													))}
												</div>
											</FieldGroup>
											{isInvalid && (
												<FieldError errors={field.state.meta.errors} />
											)}
										</FieldSet>
									);
								}}
							</form.Field>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="options">
					<Card>
						<CardHeader>
							<CardTitle>{t("titles.options")}</CardTitle>
							<CardDescription>{t("descriptions.optionsCard")}</CardDescription>
						</CardHeader>
						<CardContent>
							<Suspense
								fallback={
									<div className="space-y-2">
										<Skeleton className="h-16 w-full" />
										<Skeleton className="h-16 w-full" />
									</div>
								}
							>
								<ItemOptionsSelector
									storeId={storeId}
									selectedOptionGroupIds={selectedOptionGroupIds}
									onSelectionChange={setSelectedOptionGroupIds}
								/>
							</Suspense>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<Field orientation="horizontal">
						<Button
							type="button"
							variant="outline"
							onClick={() => window.history.back()}
						>
							{tCommon("buttons.cancel")}
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? isEditing
									? tCommon("states.updating")
									: tCommon("states.creating")
								: isEditing
									? t("buttons.updateItem")
									: t("buttons.createItem")}
						</Button>
					</Field>
				)}
			</form.Subscribe>
		</form>
	);
}
