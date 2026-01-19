import type { AppRouter } from "@menuvo/api/trpc";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	cn,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
	Input,
	LoadingButton,
	PriceInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	Switch,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { InfoIcon } from "lucide-react";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ImageUploadField } from "@/features/images/components/image-upload-field.tsx";
import { useDisplayLanguage } from "@/features/menu/contexts/display-language-context";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { ALLERGEN_KEYS } from "../constants.ts";
import { getDisplayName } from "../logic/display.ts";
import {
	formToTranslations,
	itemFormSchema,
	translationsToForm,
} from "../schemas.ts";
import { ItemOptionsSelector } from "./item-options-selector.tsx";
import { ItemValidationPanel } from "./item-validation-panel.tsx";
import { VatGroupSelector } from "./vat-group-selector.tsx";

type RouterOutput = inferRouterOutputs<AppRouter>;
type RouterInput = inferRouterInputs<AppRouter>;
type Category = RouterOutput["menu"]["categories"]["list"][number];
type Item = NonNullable<RouterOutput["menu"]["items"]["getById"]>;
type CreateItemInput = RouterInput["menu"]["items"]["create"];
type UpdateItemInput = RouterInput["menu"]["items"]["update"];
type CategoryItemSummary = {
	id: string;
	isActive: boolean;
	imageUrl: string | null;
};
export type CategoryWithItems = Category & { items: CategoryItemSummary[] };

interface ItemFormProps {
	item?: Item;
	categories: CategoryWithItems[];
	categoryId?: string;
	storeId: string;
	merchantId: string;
	initialOptionGroupIds?: string[];
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
	const { t: tToasts } = useTranslation("toasts");
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const language = useDisplayLanguage();
	const isEditing = !!item;

	const [selectedOptionGroupIds, setSelectedOptionGroupIds] = useState<
		string[]
	>(initialOptionGroupIds);

	// Get initial category ID from props (edit mode uses item.categoryId, new mode uses categoryId prop)
	const initialCategoryId = item?.categoryId ?? categoryId;

	// Mutations that work with dynamic categoryId from form
	const createItemMutation = useMutation({
		mutationFn: (input: CreateItemInput) =>
			trpcClient.menu.items.create.mutate(input),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: trpc.menu.items.listByStore.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.menu.queries.getCategory.queryKey({
					categoryId: variables.categoryId,
				}),
			});
			toast.success(tToasts("success.itemCreated"));
		},
		onError: () => {
			toast.error(tToasts("error.createItem"));
		},
	});

	const updateItemMutation = useMutation({
		mutationFn: (input: UpdateItemInput) =>
			trpcClient.menu.items.update.mutate(input),
		onSuccess: (updatedItem, variables) => {
			// Invalidate item detail cache
			queryClient.invalidateQueries({
				queryKey: trpc.menu.items.getById.queryKey({ id: updatedItem.id }),
			});
			// Invalidate list query
			queryClient.invalidateQueries({
				queryKey: trpc.menu.items.listByStore.queryKey({ storeId }),
			});
			// Always invalidate the current category
			if (initialCategoryId) {
				queryClient.invalidateQueries({
					queryKey: trpc.menu.queries.getCategory.queryKey({
						categoryId: initialCategoryId,
					}),
				});
			}
			// If category changed, also invalidate the new category
			if (variables.categoryId && variables.categoryId !== initialCategoryId) {
				queryClient.invalidateQueries({
					queryKey: trpc.menu.queries.getCategory.queryKey({
						categoryId: variables.categoryId,
					}),
				});
			}
			toast.success(tToasts("success.itemUpdated"));
		},
		onError: () => {
			toast.error(tToasts("error.updateItem"));
		},
	});

	const toggleActiveMutation = useMutation({
		mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
			trpcClient.menu.items.toggleActive.mutate({ id, isActive }),
		onSuccess: () => {
			// No toast - the switch provides immediate visual feedback
			if (item) {
				queryClient.invalidateQueries({
					queryKey: trpc.menu.items.getById.queryKey({ id: item.id }),
				});
			}
			if (initialCategoryId) {
				queryClient.invalidateQueries({
					queryKey: trpc.menu.queries.getCategory.queryKey({
						categoryId: initialCategoryId,
					}),
				});
			}
			queryClient.invalidateQueries({
				queryKey: trpc.menu.items.listByStore.queryKey({ storeId }),
			});
		},
		onError: (error) => {
			if (error.message.includes("validation")) {
				toast.error(tToasts("error.cannotActivateWithIssues"));
			} else {
				toast.error(tToasts("error.updateItem"));
			}
		},
	});

	// Get form defaults from translations
	const defaultTranslations = translationsToForm(
		item?.translations ?? null,
		language,
	);

	const form = useForm({
		defaultValues: {
			categoryId: initialCategoryId ?? "",
			name: defaultTranslations.name,
			description: defaultTranslations.description,
			price: item ? String(item.price) : "0",
			imageUrl: item?.imageUrl ?? "",
			allergens: item?.allergens ?? ([] as string[]),
			kitchenName: item?.kitchenName ?? "",
			vatGroupId: item?.vatGroupId ?? null,
		},
		validators: {
			onSubmit: itemFormSchema,
		},
		onSubmit: async ({ value }) => {
			const selectedCategoryId = value.categoryId;
			const priceInCents = Number.parseInt(value.price, 10) || 0;
			const translations = formToTranslations(
				{ name: value.name, description: value.description },
				language,
				item?.translations ?? undefined,
			) as Record<string, { name: string; description?: string }>;

			try {
				let itemId: string;

				if (isEditing) {
					await updateItemMutation.mutateAsync({
						id: item.id,
						categoryId: selectedCategoryId,
						translations,
						price: priceInCents,
						imageUrl: value.imageUrl || undefined,
						allergens: value.allergens,
						kitchenName: value.kitchenName || undefined,
						vatGroupId: value.vatGroupId,
					});
					itemId = item.id;
				} else {
					const newItem = await createItemMutation.mutateAsync({
						categoryId: selectedCategoryId,
						translations,
						price: priceInCents,
						imageUrl: value.imageUrl || undefined,
						allergens: value.allergens,
						kitchenName: value.kitchenName || undefined,
						vatGroupId: value.vatGroupId ?? undefined,
					});
					itemId = newItem.id;
				}

				// Save item options
				await trpcClient.menu.options.updateItemOptions.mutate({
					itemId,
					optionGroupIds: selectedOptionGroupIds,
				});

				// Navigate back to the category's items list
				const targetCategoryId = selectedCategoryId;
				navigate({
					to: "/menu/categories/$categoryId",
					params: { categoryId: targetCategoryId },
					search: { storeId },
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
			{/* Validation Panel - only shown when editing */}
			{isEditing && item.validation && (
				<ItemValidationPanel validation={item.validation} />
			)}

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
								{/* Row: Name + Kitchen Name */}
								<div className="grid gap-6 md:grid-cols-2">
									<form.Field name="name">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name} required>
														{tForms("fields.name")}
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														placeholder={t("placeholders.itemName")}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														aria-invalid={isInvalid}
														required
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
													)}
												</Field>
											);
										}}
									</form.Field>

									<form.Field name="kitchenName">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel
														htmlFor={field.name}
														className="inline-flex items-center gap-1"
													>
														{t("labels.kitchenName")}
														<Tooltip>
															<TooltipTrigger asChild>
																<InfoIcon className="size-3.5 text-muted-foreground" />
															</TooltipTrigger>
															<TooltipContent>
																{t("hints.kitchenName")}
															</TooltipContent>
														</Tooltip>
													</FieldLabel>
													<Input
														id={field.name}
														name={field.name}
														placeholder={t("placeholders.kitchenName")}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														maxLength={50}
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

								{/* Row: Price + Status (when editing) */}
								<div className="flex items-end gap-6">
									<form.Field name="price">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid} className="w-40">
													<FieldLabel htmlFor={field.name} required>
														{tForms("fields.price")}
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

									{/* Status toggle - only shown when editing */}
									{isEditing && item && (
										<div className="flex h-10 items-center gap-2">
											<Switch
												id="item-active-toggle"
												checked={item.isActive}
												disabled={
													toggleActiveMutation.isPending ||
													(!item.isActive &&
														item.validation &&
														!item.validation.isPublishable)
												}
												onCheckedChange={() => {
													const isPublishable =
														item.validation?.isPublishable ?? true;
													if (!item.isActive && !isPublishable) {
														toast.error(
															tToasts("error.cannotActivateWithIssues"),
														);
														return;
													}
													toggleActiveMutation.mutate({
														id: item.id,
														isActive: !item.isActive,
													});
												}}
											/>
											<span
												className={cn(
													"whitespace-nowrap font-medium text-sm",
													item.isActive
														? "text-green-600 dark:text-green-500"
														: "text-muted-foreground",
												)}
											>
												{item.isActive
													? t("labels.active")
													: t("labels.hidden")}
											</span>
										</div>
									)}
								</div>

								{/* Row: Category + VAT Group */}
								<div className="grid gap-6 md:grid-cols-2">
									<form.Field name="categoryId">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name} required>
														{tForms("fields.category")}
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
																	value={category.id}
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

									<form.Field name="vatGroupId">
										{(field) => (
											<Field>
												<FieldLabel htmlFor="item-vat-group">
													{t("vat.labels.vatGroup")}
												</FieldLabel>
												<Suspense
													fallback={
														<div className="h-10 animate-pulse rounded-md bg-muted" />
													}
												>
													<VatGroupSelector
														value={field.state.value}
														onChange={(value) => field.handleChange(value)}
														showInheritOption
													/>
												</Suspense>
											</Field>
										)}
									</form.Field>
								</div>

								{/* Description - full width */}
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
					<div className="flex justify-end gap-3">
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
					</div>
				)}
			</form.Subscribe>
		</form>
	);
}
