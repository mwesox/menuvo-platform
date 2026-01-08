import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@menuvo/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@menuvo/ui/card";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@menuvo/ui/field";
import { Input } from "@menuvo/ui/input";
import { LoadingButton } from "@menuvo/ui/loading-button";
import { formatPriceModifier } from "@menuvo/ui/price-input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@menuvo/ui/select";
import { Textarea } from "@menuvo/ui/textarea";
import type { OptionChoice, OptionGroup, OptionGroupType } from "@menuvo/db/schema";
import { getLocalizedContent } from "@/features/translations/logic/localization";
import { useSaveOptionGroupWithChoices } from "../options.queries";
import { formToTranslations } from "../schemas";

interface ChoiceFormValue {
	id?: string;
	name: string;
	priceModifier: string; // in cents, can be negative
}

type OptionGroupWithChoices = OptionGroup & { choices: OptionChoice[] };

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

	const saveMutation = useSaveOptionGroupWithChoices(storeId);

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
			type: optionGroup.type,
			choices,
		};
	})();

	const form = useForm({
		defaultValues: initialValues,
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
				to: "/menu/options",
				search: { storeId },
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
						<div className="flex items-center justify-between">
							<h3 className="font-medium text-sm">{t("labels.choices")}</h3>
							<form.Field name="choices" mode="array">
								{(field) => (
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
									>
										<PlusIcon className="mr-1.5 size-4" />
										{t("actions.addChoice")}
									</Button>
								)}
							</form.Field>
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
												// biome-ignore lint/suspicious/noArrayIndexKey: Form array items are reordered and don't have stable IDs
												key={index}
												className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3"
											>
												<div className="flex-1 space-y-3">
													<form.Field name={`choices[${index}].name`}>
														{(nameField) => (
															<Input
																placeholder={t("placeholders.choiceName")}
																value={nameField.state.value}
																onChange={(e) =>
																	nameField.handleChange(e.target.value)
																}
																onBlur={nameField.handleBlur}
															/>
														)}
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
								</div>
							)}
						</form.Field>
					</div>

					<div className="mt-6 flex justify-end gap-3">
						<Button type="button" variant="outline" asChild>
							<Link to="/menu/options" search={{ storeId }}>
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
