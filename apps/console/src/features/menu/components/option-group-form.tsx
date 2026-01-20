import type { AppRouter } from "@menuvo/api/trpc";
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
	formatPriceModifier,
	Input,
	LoadingButton,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{isEditing ? t("titles.editOptionGroup") : t("titles.addOptionGroup")}
				</CardTitle>
				<CardDescription>
					{isEditing
						? t("dialogs.updateOptionGroupDescription")
						: t("dialogs.createOptionGroupDescription")}
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
										<FieldLabel htmlFor="option-group-name">
											{tForms("fields.name")} *
										</FieldLabel>
										<Input
											id="option-group-name"
											name={field.name}
											placeholder={t("placeholders.optionGroupName")}
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
										<FieldLabel htmlFor="option-group-description">
											{tForms("fields.description")}
										</FieldLabel>
										<Textarea
											id="option-group-description"
											name={field.name}
											placeholder={t("placeholders.optionGroupDescription")}
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

						<form.Field name="type">
							{(field) => (
								<Field>
									<FieldLabel htmlFor="option-group-type">
										{t("labels.optionGroupType")}
									</FieldLabel>
									<Select
										value={field.state.value}
										onValueChange={(value) =>
											field.handleChange(value as OptionGroupType)
										}
									>
										<SelectTrigger id="option-group-type">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="single_select">
												{t("optionTypes.singleSelect")}
											</SelectItem>
											<SelectItem value="multi_select">
												{t("optionTypes.multiSelect")}
											</SelectItem>
											<SelectItem value="quantity_select">
												{t("optionTypes.quantitySelect")}
											</SelectItem>
										</SelectContent>
									</Select>
								</Field>
							)}
						</form.Field>
					</FieldGroup>

					{/* Choices Section */}
					<div className="mt-6 space-y-4">
						<div>
							<h3 className="font-medium text-sm">{t("labels.choices")}</h3>
						</div>

						<form.Field name="choices" mode="array">
							{(field) => (
								<div className="space-y-2">
									{field.state.value.length === 0 ? (
										<p className="py-4 text-center text-muted-foreground text-sm">
											{t("optionGroups.noChoices")}
										</p>
									) : (
										field.state.value.map((_choice, index) => (
											<div
												key={index}
												className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3"
											>
												<div className="flex-1 space-y-3">
													<form.Field name={`choices[${index}].name`}>
														{(nameField) => {
															const isInvalid =
																nameField.state.meta.isTouched &&
																!nameField.state.meta.isValid;
															return (
																<Field data-invalid={isInvalid}>
																	<Input
																		name={nameField.name}
																		placeholder={t("placeholders.choiceName")}
																		value={nameField.state.value}
																		onChange={(e) =>
																			nameField.handleChange(e.target.value)
																		}
																		onBlur={nameField.handleBlur}
																		aria-invalid={isInvalid}
																	/>
																	{isInvalid && (
																		<FieldError
																			errors={nameField.state.meta.errors}
																		/>
																	)}
																</Field>
															);
														}}
													</form.Field>
													<div className="flex items-center gap-2">
														<form.Field
															name={`choices[${index}].priceModifier`}
														>
															{(priceField) => {
																const cents =
																	Number.parseInt(priceField.state.value, 10) ||
																	0;
																return (
																	<div className="flex items-center gap-2">
																		<Input
																			type="number"
																			placeholder="0"
																			value={priceField.state.value}
																			onChange={(e) =>
																				priceField.handleChange(e.target.value)
																			}
																			onBlur={priceField.handleBlur}
																			className="w-24"
																		/>
																		<span className="text-muted-foreground text-sm">
																			ct
																		</span>
																		<span className="min-w-[70px] text-muted-foreground text-sm tabular-nums">
																			({formatPriceModifier(cents)})
																		</span>
																	</div>
																);
															}}
														</form.Field>
													</div>
												</div>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="text-destructive hover:bg-destructive/10 hover:text-destructive"
													onClick={() => field.removeValue(index)}
												>
													<Trash2Icon className="size-4" />
													<span className="sr-only">
														{tCommon("buttons.delete")}
													</span>
												</Button>
											</div>
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
										className="mt-2"
									>
										<PlusIcon className="mr-1.5 size-4" />
										{t("actions.addChoice")}
									</Button>
								</div>
							)}
						</form.Field>
					</div>

					<div className="mt-6 flex justify-end gap-3">
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
										: t("buttons.createOptionGroup")}
								</LoadingButton>
							)}
						</form.Subscribe>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
