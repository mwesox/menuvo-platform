import {
	Box,
	Button,
	Card,
	Checkbox,
	createListCollection,
	Field,
	Fieldset,
	HStack,
	Input,
	Portal,
	Select,
	SimpleGrid,
	Skeleton,
	Switch,
	Tabs,
	Text,
	Textarea,
	VisuallyHidden,
	VStack,
} from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { InfoIcon } from "lucide-react";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FieldError } from "@/components/ui/field-error";
import { FormField } from "@/components/ui/form-field";
import { PriceInput } from "@/components/ui/price-input";
import { Tooltip } from "@/components/ui/tooltip";
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
					to: "/stores/$storeId/menu/categories/$categoryId",
					params: { storeId, categoryId: targetCategoryId },
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
		>
			<VStack gap="6" align="stretch">
				{/* Validation Panel - only shown when editing */}
				{isEditing && item.validation && (
					<ItemValidationPanel validation={item.validation} />
				)}

				<Tabs.Root defaultValue="details">
					<Tabs.List>
						<Tabs.Trigger value="details">
							{t("titles.itemDetails")}
						</Tabs.Trigger>
						<Tabs.Trigger value="media">{t("labels.itemImage")}</Tabs.Trigger>
						<Tabs.Trigger value="allergens">
							{t("titles.allergens")}
						</Tabs.Trigger>
						<Tabs.Trigger value="options">{t("titles.options")}</Tabs.Trigger>
					</Tabs.List>

					<Tabs.Content value="details">
						<Card.Root>
							<Card.Header>
								<Card.Title>{t("titles.itemDetails")}</Card.Title>
								<Card.Description>
									{t("descriptions.itemDetailsCard")}
								</Card.Description>
							</Card.Header>
							<Card.Body>
								<VStack gap="6" align="stretch">
									{/* Row: Name + Kitchen Name */}
									<SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
										<form.Field name="name">
											{(field) => (
												<FormField
													field={field}
													label={tForms("fields.name")}
													required
												>
													<Input
														id={field.name}
														name={field.name}
														placeholder={t("placeholders.itemName")}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														required
													/>
												</FormField>
											)}
										</form.Field>

										<form.Field name="kitchenName">
											{(field) => (
												<FormField
													field={field}
													label={
														<HStack gap="1" alignItems="center">
															<Text>{t("labels.kitchenName")}</Text>
															<Tooltip content={t("hints.kitchenName")}>
																<Box>
																	<InfoIcon
																		style={{
																			height: "0.875rem",
																			width: "0.875rem",
																		}}
																		color="var(--chakra-colors-fg-muted)"
																	/>
																</Box>
															</Tooltip>
														</HStack>
													}
												>
													<Input
														id={field.name}
														name={field.name}
														placeholder={t("placeholders.kitchenName")}
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => field.handleChange(e.target.value)}
														maxLength={50}
													/>
												</FormField>
											)}
										</form.Field>
									</SimpleGrid>

									{/* Row: Price + Status (when editing) */}
									<HStack gap="6" alignItems="flex-end">
										<form.Field name="price">
											{(field) => (
												<FormField
													field={field}
													label={tForms("fields.price")}
													required
												>
													<Box w="40">
														<PriceInput
															id={field.name}
															name={field.name}
															value={
																Number.parseInt(field.state.value, 10) || 0
															}
															onChange={(cents) =>
																field.handleChange(String(cents))
															}
															onBlur={field.handleBlur}
														/>
													</Box>
												</FormField>
											)}
										</form.Field>

										{/* Status toggle - only shown when editing */}
										{isEditing && item && (
											<HStack h="10" gap="2" alignItems="center">
												<Switch.Root
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
													colorPalette="red"
												>
													<Switch.HiddenInput />
													<Switch.Control />
												</Switch.Root>
												<Text
													whiteSpace="nowrap"
													fontWeight="medium"
													textStyle="sm"
													color={item.isActive ? "fg.success" : "fg.muted"}
												>
													{item.isActive
														? t("labels.active")
														: t("labels.hidden")}
												</Text>
											</HStack>
										)}
									</HStack>

									{/* Row: Category + VAT Group */}
									<SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
										<form.Field name="categoryId">
											{(field) => {
												const categoryCollection = createListCollection({
													items: categories.map((category) => ({
														value: category.id,
														label: getDisplayName(
															category.translations,
															language,
														),
													})),
												});
												return (
													<FormField
														field={field}
														label={tForms("fields.category")}
														required
													>
														<Select.Root
															collection={categoryCollection}
															value={
																field.state.value ? [field.state.value] : []
															}
															onValueChange={(e) =>
																field.handleChange(e.value[0] ?? "")
															}
														>
															<Select.HiddenSelect />
															<Select.Control>
																<Select.Trigger id={field.name}>
																	<Select.ValueText
																		placeholder={t(
																			"placeholders.selectCategory",
																		)}
																	/>
																	<Select.IndicatorGroup>
																		<Select.Indicator />
																	</Select.IndicatorGroup>
																</Select.Trigger>
															</Select.Control>
															<Portal>
																<Select.Positioner>
																	<Select.Content>
																		{categoryCollection.items.map((item) => (
																			<Select.Item key={item.value} item={item}>
																				{item.label}
																				<Select.ItemIndicator />
																			</Select.Item>
																		))}
																	</Select.Content>
																</Select.Positioner>
															</Portal>
														</Select.Root>
													</FormField>
												);
											}}
										</form.Field>

										<form.Field name="vatGroupId">
											{(field) => (
												<Field.Root>
													<Field.Label htmlFor="item-vat-group">
														{t("vat.labels.vatGroup")}
													</Field.Label>
													<Suspense fallback={<Skeleton h="10" rounded="md" />}>
														<VatGroupSelector
															value={field.state.value}
															onChange={(value) => field.handleChange(value)}
															showInheritOption
														/>
													</Suspense>
												</Field.Root>
											)}
										</form.Field>
									</SimpleGrid>

									{/* Description - full width */}
									<form.Field name="description">
										{(field) => (
											<FormField
												field={field}
												label={tForms("fields.description")}
											>
												<Textarea
													id={field.name}
													name={field.name}
													placeholder={t("placeholders.itemDescription")}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													rows={2}
												/>
											</FormField>
										)}
									</form.Field>
								</VStack>
							</Card.Body>
						</Card.Root>
					</Tabs.Content>

					<Tabs.Content value="media">
						<Card.Root>
							<Card.Header>
								<Card.Title>{t("labels.itemImage")}</Card.Title>
								<Card.Description>
									{t("descriptions.itemDetailsCard")}
								</Card.Description>
							</Card.Header>
							<Card.Body>
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
							</Card.Body>
						</Card.Root>
					</Tabs.Content>

					<Tabs.Content value="allergens">
						<Card.Root>
							<Card.Header>
								<Card.Title>{t("titles.allergens")}</Card.Title>
								<Card.Description>
									{t("descriptions.allergensCard")}
								</Card.Description>
							</Card.Header>
							<Card.Body>
								<form.Field name="allergens" mode="array">
									{(field) => (
										<Fieldset.Root>
											<VisuallyHidden asChild>
												<Fieldset.Legend>Allergens</Fieldset.Legend>
											</VisuallyHidden>
											<SimpleGrid columns={{ base: 1, sm: 3, md: 4 }} gap="3">
												{ALLERGEN_KEYS.map((allergenKey) => (
													<Checkbox.Root
														key={allergenKey}
														id={`allergen-${allergenKey}`}
														checked={field.state.value.includes(allergenKey)}
														onCheckedChange={(e) => {
															if (e.checked) {
																field.pushValue(allergenKey);
															} else {
																const index =
																	field.state.value.indexOf(allergenKey);
																if (index > -1) {
																	field.removeValue(index);
																}
															}
														}}
													>
														<Checkbox.HiddenInput />
														<Checkbox.Control />
														<Checkbox.Label>
															{t(`allergens.${allergenKey}`)}
														</Checkbox.Label>
													</Checkbox.Root>
												))}
											</SimpleGrid>
											{field.state.meta.isTouched &&
												!field.state.meta.isValid && (
													<FieldError errors={field.state.meta.errors} />
												)}
										</Fieldset.Root>
									)}
								</form.Field>
							</Card.Body>
						</Card.Root>
					</Tabs.Content>

					<Tabs.Content value="options">
						<Card.Root>
							<Card.Header>
								<Card.Title>{t("titles.options")}</Card.Title>
								<Card.Description>
									{t("descriptions.optionsCard")}
								</Card.Description>
							</Card.Header>
							<Card.Body>
								<Suspense
									fallback={
										<VStack gap="2">
											<Skeleton h="16" w="full" />
											<Skeleton h="16" w="full" />
										</VStack>
									}
								>
									<ItemOptionsSelector
										storeId={storeId}
										selectedOptionGroupIds={selectedOptionGroupIds}
										onSelectionChange={setSelectedOptionGroupIds}
									/>
								</Suspense>
							</Card.Body>
						</Card.Root>
					</Tabs.Content>
				</Tabs.Root>

				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => (
						<HStack justify="flex-end" gap="3">
							<Button type="button" variant="outline" asChild>
								<Link
									to="/stores/$storeId/menu/categories/$categoryId"
									params={{
										storeId,
										categoryId: initialCategoryId ?? categoryId ?? "",
									}}
								>
									{tCommon("buttons.cancel")}
								</Link>
							</Button>
							<Button
								type="submit"
								loading={isSubmitting}
								loadingText={
									isEditing
										? tCommon("states.updating")
										: tCommon("states.creating")
								}
							>
								{isEditing ? t("buttons.updateItem") : t("buttons.createItem")}
							</Button>
						</HStack>
					)}
				</form.Subscribe>
			</VStack>
		</form>
	);
}
