import {
	Box,
	Button,
	Card,
	createListCollection,
	Field,
	HStack,
	Input,
	Portal,
	Select,
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
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FormField } from "@/components/ui/form-field";
import { formatPriceModifier } from "@/components/ui/price-input";
import { Caption, Label } from "@/components/ui/typography";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { getLocalizedContent } from "../logic/localization";
import {
	type OptionGroupType,
	optionGroupFormSchema,
} from "../options.schemas";
import { formToTranslations } from "../schemas";

interface ChoiceFormValue {
	id?: string;
	name: string;
	priceModifier: string; // in cents, can be negative
}

type RouterOutput = inferRouterOutputs<AppRouter>;
type OptionGroupWithChoices = NonNullable<
	RouterOutput["menu"]["options"]["getGroup"]
>;

interface OptionGroupFormProps {
	storeId: string;
	optionGroup?: OptionGroupWithChoices;
}

export function OptionGroupForm({
	storeId,
	optionGroup,
}: OptionGroupFormProps) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const { t: tForms } = useTranslation("forms");
	const navigate = useNavigate();

	const isEditing = !!optionGroup;
	const language = "de";

	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t: tToasts } = useTranslation("toasts");

	type RouterInput = inferRouterInputs<AppRouter>;
	type SaveOptionGroupInput =
		RouterInput["menu"]["options"]["saveGroupWithChoices"];

	const saveMutation = useMutation({
		mutationKey: trpc.menu.options.saveGroupWithChoices.mutationKey(),
		mutationFn: async (input: Omit<SaveOptionGroupInput, "storeId">) =>
			trpcClient.menu.options.saveGroupWithChoices.mutate({
				storeId,
				...input,
			}),
		onSuccess: (savedGroup) => {
			const group = savedGroup as { id: string };
			queryClient.invalidateQueries({
				queryKey: trpc.menu.options.getGroup.queryKey({
					optionGroupId: group.id,
				}),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.menu.options.listGroups.queryKey({ storeId }),
			});
			toast.success(tToasts("success.optionGroupSaved"));
		},
		onError: () => {
			toast.error(tToasts("error.saveOptionGroup"));
		},
	});

	// Compute initial values from optionGroup if editing
	const initialValues = (() => {
		if (!optionGroup) {
			return {
				name: "",
				description: "",
				type: "multi_select" as OptionGroupType,
				choices: [] as ChoiceFormValue[],
			};
		}

		const { name, description } = getLocalizedContent(
			optionGroup.translations,
			language,
			language,
		);

		const choices = optionGroup.choices.map((choice) => {
			const choiceContent = getLocalizedContent(
				choice.translations,
				language,
				language,
			);
			return {
				id: choice.id,
				name: choiceContent.name,
				priceModifier: String(choice.priceModifier),
			};
		});

		return {
			name,
			description: description ?? "",
			type: optionGroup.type as OptionGroupType,
			choices,
		};
	})();

	const form = useForm({
		defaultValues: initialValues,
		validators: {
			onSubmit: optionGroupFormSchema,
		},
		onSubmit: async ({ value }) => {
			const translations = formToTranslations(
				{ name: value.name, description: value.description },
				language,
				optionGroup?.translations ?? {},
			);

			// Find existing choices to preserve their translations
			const existingChoicesMap = new Map(
				optionGroup?.choices.map((c) => [c.id, c]) ?? [],
			);

			// Transform form choices to server format
			const choices = value.choices.map((choice) => {
				const existingChoice = choice.id
					? existingChoicesMap.get(choice.id)
					: undefined;
				const choiceTranslations = existingChoice?.translations ?? {};

				return {
					id: choice.id,
					translations: {
						...choiceTranslations,
						[language]: { name: choice.name },
					},
					priceModifier: Number.parseInt(choice.priceModifier, 10) || 0,
					isDefault: false,
					minQuantity: 0,
					maxQuantity: null,
				};
			});

			await saveMutation.mutateAsync({
				optionGroupId: optionGroup?.id,
				translations,
				type: value.type,
				minSelections: optionGroup?.minSelections ?? 0,
				maxSelections: optionGroup?.maxSelections ?? null,
				numFreeOptions: optionGroup?.numFreeOptions ?? 0,
				aggregateMinQuantity: optionGroup?.aggregateMinQuantity ?? null,
				aggregateMaxQuantity: optionGroup?.aggregateMaxQuantity ?? null,
				choices,
			});

			navigate({
				to: "/stores/$storeId/menu/options",
				params: { storeId },
			});
		},
	});

	const typeCollection = createListCollection({
		items: [
			{ value: "single_select", label: t("optionTypes.singleSelect") },
			{ value: "multi_select", label: t("optionTypes.multiSelect") },
			{ value: "quantity_select", label: t("optionTypes.quantitySelect") },
		],
	});

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>
					{isEditing ? t("titles.editOptionGroup") : t("titles.addOptionGroup")}
				</Card.Title>
				<Card.Description>
					{isEditing
						? t("dialogs.updateOptionGroupDescription")
						: t("dialogs.createOptionGroupDescription")}
				</Card.Description>
			</Card.Header>
			<Card.Body>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<VStack gap="6" align="stretch">
						<form.Field name="name">
							{(field) => (
								<FormField
									field={field}
									label={`${tForms("fields.name")} *`}
									required
								>
									<Input
										id="option-group-name"
										name={field.name}
										placeholder={t("placeholders.optionGroupName")}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</FormField>
							)}
						</form.Field>

						<form.Field name="description">
							{(field) => (
								<FormField field={field} label={tForms("fields.description")}>
									<Textarea
										id="option-group-description"
										name={field.name}
										placeholder={t("placeholders.optionGroupDescription")}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										rows={3}
									/>
								</FormField>
							)}
						</form.Field>

						<form.Field name="type">
							{(field) => (
								<Field.Root>
									<Field.Label htmlFor="option-group-type">
										{t("labels.optionGroupType")}
									</Field.Label>
									<Select.Root
										collection={typeCollection}
										value={field.state.value ? [field.state.value] : []}
										onValueChange={(e) =>
											field.handleChange((e.value[0] ?? "") as OptionGroupType)
										}
									>
										<Select.HiddenSelect />
										<Select.Control>
											<Select.Trigger id="option-group-type">
												<Select.ValueText />
												<Select.IndicatorGroup>
													<Select.Indicator />
												</Select.IndicatorGroup>
											</Select.Trigger>
										</Select.Control>
										<Portal>
											<Select.Positioner>
												<Select.Content>
													{typeCollection.items.map((item) => (
														<Select.Item key={item.value} item={item}>
															{item.label}
															<Select.ItemIndicator />
														</Select.Item>
													))}
												</Select.Content>
											</Select.Positioner>
										</Portal>
									</Select.Root>
								</Field.Root>
							)}
						</form.Field>
					</VStack>

					{/* Choices Section */}
					<Box mt="6">
						<VStack gap="4" align="stretch">
							<Label>{t("labels.choices")}</Label>

							<form.Field name="choices" mode="array">
								{(field) => (
									<VStack gap="2" align="stretch">
										{field.state.value.length === 0 ? (
											<Text py="4" textAlign="center" textStyle="caption">
												{t("optionGroups.noChoices")}
											</Text>
										) : (
											field.state.value.map((_choice, index) => (
												<Box
													key={index}
													display="flex"
													alignItems="flex-start"
													gap="3"
													rounded="lg"
													borderWidth="1px"
													bg="bg.muted"
													p="3"
												>
													<VStack flex="1" gap="3" align="stretch">
														<form.Field name={`choices[${index}].name`}>
															{(nameField) => (
																<FormField
																	field={nameField}
																	label={
																		<VisuallyHidden>
																			{t("placeholders.choiceName")}
																		</VisuallyHidden>
																	}
																>
																	<Input
																		name={nameField.name}
																		placeholder={t("placeholders.choiceName")}
																		value={nameField.state.value}
																		onChange={(e) =>
																			nameField.handleChange(e.target.value)
																		}
																		onBlur={nameField.handleBlur}
																	/>
																</FormField>
															)}
														</form.Field>
														<HStack gap="2" alignItems="center">
															<form.Field
																name={`choices[${index}].priceModifier`}
															>
																{(priceField) => {
																	const cents =
																		Number.parseInt(
																			priceField.state.value,
																			10,
																		) || 0;
																	return (
																		<HStack gap="2" alignItems="center">
																			<Input
																				type="number"
																				placeholder="0"
																				value={priceField.state.value}
																				onChange={(e) =>
																					priceField.handleChange(
																						e.target.value,
																					)
																				}
																				onBlur={priceField.handleBlur}
																				w="24"
																			/>
																			<Caption>ct</Caption>
																			<Text
																				minW="70px"
																				textStyle="caption"
																				fontVariantNumeric="tabular-nums"
																			>
																				({formatPriceModifier(cents)})
																			</Text>
																		</HStack>
																	);
																}}
															</form.Field>
														</HStack>
													</VStack>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														colorPalette="red"
														onClick={() => field.removeValue(index)}
													>
														<Trash2Icon
															style={{ height: "1rem", width: "1rem" }}
														/>
														<VisuallyHidden>
															{tCommon("buttons.delete")}
														</VisuallyHidden>
													</Button>
												</Box>
											))
										)}
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() =>
												field.pushValue({
													name: "",
													priceModifier: "0",
												})
											}
											mt="2"
										>
											<PlusIcon
												style={{
													marginRight: "0.375rem",
													height: "1rem",
													width: "1rem",
												}}
											/>
											{t("actions.addChoice")}
										</Button>
									</VStack>
								)}
							</form.Field>
						</VStack>
					</Box>

					<HStack mt="6" justify="flex-end" gap="3">
						<Button type="button" variant="outline" asChild>
							<Link to="/stores/$storeId/menu/options" params={{ storeId }}>
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
								<Button
									type="submit"
									disabled={!canSubmit}
									loading={isSubmitting}
									loadingText={
										isEditing
											? tCommon("states.saving")
											: tCommon("states.creating")
									}
								>
									{isEditing
										? tCommon("buttons.saveChanges")
										: t("buttons.createOptionGroup")}
								</Button>
							)}
						</form.Subscribe>
					</HStack>
				</form>
			</Card.Body>
		</Card.Root>
	);
}
