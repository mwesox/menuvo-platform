import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { LoadingButton } from "@/components/ui/loading-button";
import { PriceInput } from "@/components/ui/price-input.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import type { Category, Item } from "@/db/schema.ts";
import { ImageUploadField } from "@/features/console/images/components/image-upload-field.tsx";
import { useDisplayLanguage } from "@/features/console/menu/contexts/display-language-context";
import { ALLERGEN_KEYS } from "../constants.ts";
import { getDisplayName } from "../logic/display.ts";
import { categoryQueries, itemQueries } from "../queries.ts";
import {
	formToTranslations,
	itemFormSchema,
	translationsToForm,
} from "../schemas.ts";
import { createItem, updateItem } from "../server/items.functions.ts";
import { updateItemOptions } from "../server/options.functions.ts";
import { ItemOptionsSelector } from "./item-options-selector.tsx";

export type CategoryWithItems = Category & { items: unknown[] };

interface ItemFormProps {
	item?: Item;
	categories: CategoryWithItems[];
	categoryId?: number;
	storeId: number;
	merchantId: number;
	initialOptionGroupIds?: number[];
}

export function ItemForm({
	item,
	categories,
	categoryId,
	storeId,
	merchantId,
	initialOptionGroupIds = [],
}: ItemFormProps) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const { t: tForms } = useTranslation("forms");
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const language = useDisplayLanguage();
	const isEditing = !!item;

	const [selectedOptionGroupIds, setSelectedOptionGroupIds] = useState<
		number[]
	>(initialOptionGroupIds);

	// Get initial category ID from props (edit mode uses item.categoryId, new mode uses categoryId prop)
	const initialCategoryId = item?.categoryId ?? categoryId;

	// Mutations that work with dynamic categoryId from form
	const createItemMutation = useMutation({
		mutationFn: (input: {
			categoryId: number;
			translations: Record<string, { name?: string; description?: string }>;
			price: number;
			imageUrl?: string;
			allergens: string[];
		}) =>
			createItem({
				data: {
					categoryId: input.categoryId,
					storeId,
					translations: input.translations,
					price: input.price,
					imageUrl: input.imageUrl,
					allergens: input.allergens,
				},
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: itemQueries.byStore(storeId).queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: categoryQueries.byStore(storeId).queryKey,
			});
		},
	});

	const updateItemMutation = useMutation({
		mutationFn: (input: {
			itemId: number;
			categoryId?: number;
			translations?: Record<string, { name?: string; description?: string }>;
			price?: number;
			imageUrl?: string;
			allergens?: string[];
		}) =>
			updateItem({
				data: {
					itemId: input.itemId,
					categoryId: input.categoryId,
					translations: input.translations,
					price: input.price,
					imageUrl: input.imageUrl,
					allergens: input.allergens,
				},
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: itemQueries.byStore(storeId).queryKey,
			});
			queryClient.invalidateQueries({
				queryKey: categoryQueries.byStore(storeId).queryKey,
			});
		},
	});

	// Get form defaults from translations
	const defaultTranslations = translationsToForm(
		item?.translations ?? null,
		language,
	);

	const form = useForm({
		defaultValues: {
			categoryId: initialCategoryId ? String(initialCategoryId) : "",
			name: defaultTranslations.name,
			description: defaultTranslations.description,
			price: item ? String(item.price) : "0",
			imageUrl: item?.imageUrl ?? "",
			allergens: item?.allergens ?? ([] as string[]),
		},
		validators: {
			onSubmit: itemFormSchema,
		},
		onSubmit: async ({ value }) => {
			const selectedCategoryId = Number.parseInt(value.categoryId, 10);
			const priceInCents = Number.parseInt(value.price, 10) || 0;
			const translations = formToTranslations(
				{ name: value.name, description: value.description },
				language,
				item?.translations ?? undefined,
			);

			try {
				let itemId: number;

				if (isEditing) {
					await updateItemMutation.mutateAsync({
						itemId: item.id,
						categoryId: selectedCategoryId,
						translations,
						price: priceInCents,
						imageUrl: value.imageUrl || undefined,
						allergens: value.allergens,
					});
					itemId = item.id;
				} else {
					const newItem = await createItemMutation.mutateAsync({
						categoryId: selectedCategoryId,
						translations,
						price: priceInCents,
						imageUrl: value.imageUrl || undefined,
						allergens: value.allergens,
					});
					itemId = newItem.id;
				}

				// Save item options
				await updateItemOptions({
					data: { itemId, optionGroupIds: selectedOptionGroupIds },
				});

				navigate({
					to: "/console/menu",
					search: { storeId, tab: "items" as const },
				});
			} catch {
				// Error toast is handled by mutation hooks
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
								{/* Row 1: Name + Price (responsive grid) */}
								<div className="grid gap-6 md:grid-cols-[1fr,200px]">
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

									<form.Field name="price">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>
														{tForms("fields.price")} *
													</FieldLabel>
													<PriceInput
														id={field.name}
														name={field.name}
														value={Number.parseInt(field.state.value, 10) || 0}
														onChange={(cents) =>
															field.handleChange(String(cents))
														}
														onBlur={field.handleBlur}
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									</form.Field>
								</div>

								{/* Row 2: Category (full width) */}
								<form.Field name="categoryId">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													{tForms("fields.category")} *
												</FieldLabel>
												<Select
													value={field.state.value}
													onValueChange={field.handleChange}
												>
													<SelectTrigger
														id={field.name}
														aria-invalid={isInvalid}
													>
														<SelectValue
															placeholder={t("placeholders.selectCategory")}
														/>
													</SelectTrigger>
													<SelectContent>
														{categories.map((category) => (
															<SelectItem
																key={category.id}
																value={String(category.id)}
															>
																{getDisplayName(
																	category.translations,
																	language,
																)}
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

								{/* Row 3: Description (full width, 2 rows) */}
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
													rows={2}
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
													{ALLERGEN_KEYS.map((allergenKey) => (
														<Field
															key={allergenKey}
															orientation="horizontal"
															data-invalid={isInvalid}
														>
															<Checkbox
																id={`allergen-${allergenKey}`}
																checked={field.state.value.includes(
																	allergenKey,
																)}
																onCheckedChange={(checked) => {
																	if (checked) {
																		field.pushValue(allergenKey);
																	} else {
																		const index =
																			field.state.value.indexOf(allergenKey);
																		if (index > -1) {
																			field.removeValue(index);
																		}
																	}
																}}
															/>
															<FieldLabel
																htmlFor={`allergen-${allergenKey}`}
																className="font-normal"
															>
																{t(`allergens.${allergenKey}`)}
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
						<LoadingButton
							type="submit"
							isLoading={isSubmitting}
							loadingText={
								isEditing
									? tCommon("states.updating")
									: tCommon("states.creating")
							}
						>
							{isEditing ? t("buttons.updateItem") : t("buttons.createItem")}
						</LoadingButton>
					</Field>
				)}
			</form.Subscribe>
		</form>
	);
}
