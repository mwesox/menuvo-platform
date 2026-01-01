import { useForm } from "@tanstack/react-form";
import { X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
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
import { PriceInput } from "@/components/ui/price-input.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select.tsx";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import type {
	OptionChoice,
	OptionGroup,
	OptionGroupType,
} from "@/db/schema.ts";
import { optionGroupFormSchema } from "../options.validation.ts";

interface OptionGroupDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	optionGroup?: (OptionGroup & { optionChoices: OptionChoice[] }) | null;
	onSave: (data: {
		name: string;
		description?: string;
		type: OptionGroupType;
		minSelections: number;
		maxSelections: number | null;
		numFreeOptions: number;
		aggregateMinQuantity: number | null;
		aggregateMaxQuantity: number | null;
		choices: Array<{
			id?: number;
			name: string;
			priceModifier: number;
			isDefault: boolean;
			minQuantity: number;
			maxQuantity: number | null;
		}>;
	}) => Promise<void>;
}

export function OptionGroupDialog({
	open,
	onOpenChange,
	optionGroup,
	onSave,
}: OptionGroupDialogProps) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const { t: tForms } = useTranslation("forms");
	const id = useId();
	const [activeTab, setActiveTab] = useState("settings");
	const isEditing = !!optionGroup;

	const form = useForm({
		defaultValues: {
			name: "",
			description: "",
			type: "multi_select" as OptionGroupType,
			minSelections: 0,
			maxSelections: null as number | null,
			isUnlimited: true,
			numFreeOptions: 0,
			aggregateMinQuantity: null as number | null,
			aggregateMaxQuantity: null as number | null,
			choices: [] as Array<{
				id?: number;
				name: string;
				priceModifier: number;
				isDefault: boolean;
				minQuantity: number;
				maxQuantity: number | null;
			}>,
		},
		validators: {
			onSubmit: optionGroupFormSchema,
		},
		onSubmit: async ({ value }) => {
			await onSave({
				name: value.name,
				description: value.description || undefined,
				type: value.type,
				minSelections: value.minSelections,
				maxSelections: value.isUnlimited ? null : value.maxSelections,
				numFreeOptions: value.numFreeOptions,
				aggregateMinQuantity: value.aggregateMinQuantity,
				aggregateMaxQuantity: value.aggregateMaxQuantity,
				choices: value.choices.map((choice) => ({
					id: choice.id,
					name: choice.name,
					priceModifier: choice.priceModifier,
					isDefault: choice.isDefault,
					minQuantity: choice.minQuantity,
					maxQuantity: choice.maxQuantity,
				})),
			});
			onOpenChange(false);
		},
	});

	// Reset form when dialog opens or optionGroup changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: form methods are stable, including form causes infinite loop
	useEffect(() => {
		if (open) {
			form.reset();
			if (optionGroup) {
				form.setFieldValue("name", optionGroup.name);
				form.setFieldValue("description", optionGroup.description ?? "");
				form.setFieldValue("type", optionGroup.type);
				form.setFieldValue("minSelections", optionGroup.minSelections);
				form.setFieldValue("maxSelections", optionGroup.maxSelections);
				form.setFieldValue("isUnlimited", optionGroup.maxSelections === null);
				form.setFieldValue("numFreeOptions", optionGroup.numFreeOptions);
				form.setFieldValue(
					"aggregateMinQuantity",
					optionGroup.aggregateMinQuantity,
				);
				form.setFieldValue(
					"aggregateMaxQuantity",
					optionGroup.aggregateMaxQuantity,
				);
				form.setFieldValue(
					"choices",
					optionGroup.optionChoices.map((choice) => ({
						id: choice.id,
						name: choice.name,
						priceModifier: choice.priceModifier,
						isDefault: choice.isDefault,
						minQuantity: choice.minQuantity,
						maxQuantity: choice.maxQuantity,
					})),
				);
			}
			setActiveTab("settings");
		}
	}, [open, optionGroup]);

	// Helper to get type description
	const getTypeDescription = (type: OptionGroupType): string => {
		switch (type) {
			case "single_select":
				return t("optionTypes.singleSelectDesc");
			case "multi_select":
				return t("optionTypes.multiSelectDesc");
			case "quantity_select":
				return t("optionTypes.quantitySelectDesc");
			default:
				return "";
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<DialogHeader>
						<DialogTitle>
							{isEditing
								? t("titles.editOptionGroup")
								: t("titles.addOptionGroup")}
						</DialogTitle>
						<DialogDescription>
							{isEditing
								? t("dialogs.updateOptionGroupDescription")
								: t("dialogs.createOptionGroupDescription")}
						</DialogDescription>
					</DialogHeader>

					<Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
						<TabsList className="w-full">
							<TabsTrigger value="settings" className="flex-1">
								{t("labels.settings")}
							</TabsTrigger>
							<form.Subscribe selector={(state) => state.values.choices.length}>
								{(choiceCount) => (
									<TabsTrigger value="choices" className="flex-1">
										{t("labels.choices")}
										{choiceCount > 0 && ` (${choiceCount})`}
									</TabsTrigger>
								)}
							</form.Subscribe>
						</TabsList>

						<TabsContent value="settings" className="py-4">
							<FieldGroup>
								{/* Name field */}
								<form.Field name="name">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={`${id}-name`}>
													{tForms("fields.name")} *
												</FieldLabel>
												<Input
													id={`${id}-name`}
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

								{/* Description field */}
								<form.Field name="description">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={`${id}-description`}>
													{tForms("fields.description")}
												</FieldLabel>
												<Textarea
													id={`${id}-description`}
													name={field.name}
													placeholder={t("placeholders.optionGroupDescription")}
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

								{/* Type selector */}
								<form.Field name="type">
									{(field) => (
										<Field>
											<FieldLabel htmlFor={`${id}-type`}>
												{t("labels.optionGroupType")}
											</FieldLabel>
											<Select
												value={field.state.value}
												onValueChange={(value: OptionGroupType) => {
													field.handleChange(value);
													// Auto-configure based on type
													if (value === "single_select") {
														form.setFieldValue("minSelections", 1);
														form.setFieldValue("maxSelections", 1);
														form.setFieldValue("isUnlimited", false);
													} else if (value === "quantity_select") {
														form.setFieldValue("minSelections", 0);
														form.setFieldValue("maxSelections", null);
														form.setFieldValue("isUnlimited", true);
													}
												}}
											>
												<SelectTrigger id={`${id}-type`}>
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
											<p className="text-xs text-muted-foreground mt-1">
												{getTypeDescription(field.state.value)}
											</p>
										</Field>
									)}
								</form.Field>

								{/* Conditional fields based on type */}
								<form.Subscribe selector={(state) => state.values.type}>
									{(type) => (
										<>
											{/* Selection constraints for multi_select */}
											{type === "multi_select" && (
												<div className="grid grid-cols-2 gap-4">
													<form.Field name="minSelections">
														{(field) => {
															const isInvalid =
																field.state.meta.isTouched &&
																!field.state.meta.isValid;
															return (
																<Field data-invalid={isInvalid}>
																	<FieldLabel htmlFor={`${id}-min-selections`}>
																		{t("labels.minSelections")}
																	</FieldLabel>
																	<Input
																		id={`${id}-min-selections`}
																		name={field.name}
																		type="number"
																		min={0}
																		max={10}
																		value={field.state.value}
																		onBlur={field.handleBlur}
																		onChange={(e) =>
																			field.handleChange(
																				Number.parseInt(e.target.value, 10) ||
																					0,
																			)
																		}
																		aria-invalid={isInvalid}
																	/>
																	{isInvalid && (
																		<FieldError
																			errors={field.state.meta.errors}
																		/>
																	)}
																</Field>
															);
														}}
													</form.Field>

													<form.Subscribe
														selector={(state) => state.values.isUnlimited}
													>
														{(isUnlimited) => (
															<form.Field name="maxSelections">
																{(field) => {
																	const isInvalid =
																		field.state.meta.isTouched &&
																		!field.state.meta.isValid;
																	return (
																		<Field data-invalid={isInvalid}>
																			<FieldLabel
																				htmlFor={`${id}-max-selections`}
																			>
																				{t("labels.maxSelections")}
																			</FieldLabel>
																			<Input
																				id={`${id}-max-selections`}
																				name={field.name}
																				type="number"
																				min={1}
																				max={10}
																				value={field.state.value ?? ""}
																				onBlur={field.handleBlur}
																				onChange={(e) =>
																					field.handleChange(
																						Number.parseInt(
																							e.target.value,
																							10,
																						) || 1,
																					)
																				}
																				disabled={isUnlimited}
																				aria-invalid={isInvalid}
																			/>
																			<form.Field name="isUnlimited">
																				{(unlimitedField) => (
																					<div className="flex items-center gap-2">
																						<Checkbox
																							id={`${id}-unlimited`}
																							checked={
																								unlimitedField.state.value
																							}
																							onCheckedChange={(checked) => {
																								unlimitedField.handleChange(
																									checked === true,
																								);
																								if (checked) {
																									field.handleChange(null);
																								} else {
																									field.handleChange(1);
																								}
																							}}
																						/>
																						<label
																							htmlFor={`${id}-unlimited`}
																							className="text-sm font-normal text-muted-foreground"
																						>
																							{t("labels.unlimited")}
																						</label>
																					</div>
																				)}
																			</form.Field>
																			{isInvalid && (
																				<FieldError
																					errors={field.state.meta.errors}
																				/>
																			)}
																		</Field>
																	);
																}}
															</form.Field>
														)}
													</form.Subscribe>
												</div>
											)}

											{/* Aggregate quantity for quantity_select */}
											{type === "quantity_select" && (
												<div className="grid grid-cols-2 gap-4">
													<form.Field name="aggregateMinQuantity">
														{(field) => (
															<Field>
																<FieldLabel
																	htmlFor={`${id}-aggregate-min-quantity`}
																>
																	{t("labels.aggregateMinQuantity")}
																</FieldLabel>
																<Input
																	id={`${id}-aggregate-min-quantity`}
																	type="number"
																	min={0}
																	value={field.state.value ?? ""}
																	onBlur={field.handleBlur}
																	onChange={(e) =>
																		field.handleChange(
																			e.target.value
																				? Number.parseInt(e.target.value, 10)
																				: null,
																		)
																	}
																	placeholder={t(
																		"placeholders.aggregateMinQuantity",
																	)}
																/>
																<p className="text-xs text-muted-foreground">
																	{t("hints.aggregateMinQuantity")}
																</p>
															</Field>
														)}
													</form.Field>

													<form.Field name="aggregateMaxQuantity">
														{(field) => (
															<Field>
																<FieldLabel
																	htmlFor={`${id}-aggregate-max-quantity`}
																>
																	{t("labels.aggregateMaxQuantity")}
																</FieldLabel>
																<Input
																	id={`${id}-aggregate-max-quantity`}
																	type="number"
																	min={1}
																	value={field.state.value ?? ""}
																	onBlur={field.handleBlur}
																	onChange={(e) =>
																		field.handleChange(
																			e.target.value
																				? Number.parseInt(e.target.value, 10)
																				: null,
																		)
																	}
																	placeholder={t(
																		"placeholders.aggregateMaxQuantity",
																	)}
																/>
																<p className="text-xs text-muted-foreground">
																	{t("hints.aggregateMaxQuantity")}
																</p>
															</Field>
														)}
													</form.Field>
												</div>
											)}
										</>
									)}
								</form.Subscribe>

								{/* Free options */}
								<form.Field name="numFreeOptions">
									{(field) => (
										<Field>
											<FieldLabel htmlFor={`${id}-num-free-options`}>
												{t("labels.numFreeOptions")}
											</FieldLabel>
											<Input
												id={`${id}-num-free-options`}
												type="number"
												min={0}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(
														Number.parseInt(e.target.value, 10) || 0,
													)
												}
											/>
											<p className="text-xs text-muted-foreground">
												{t("hints.numFreeOptions")}
											</p>
										</Field>
									)}
								</form.Field>
							</FieldGroup>
						</TabsContent>

						<TabsContent value="choices" className="py-4">
							<form.Subscribe selector={(state) => state.values.type}>
								{(type) => (
									<form.Field name="choices" mode="array">
										{(field) => (
											<div className="space-y-3">
												{field.state.value.length === 0 ? (
													<p className="text-sm text-muted-foreground text-center py-4">
														{t("emptyStates.noChoices")}
													</p>
												) : (
													field.state.value.map((choice, index) => (
														<div
															key={choice.id ?? `new-${index}`}
															className="space-y-2 p-3 border rounded-lg bg-muted/30"
														>
															<div className="flex items-center gap-2">
																<form.Field name={`choices[${index}].name`}>
																	{(nameField) => (
																		<Input
																			placeholder={t("labels.choiceName")}
																			value={nameField.state.value}
																			onBlur={nameField.handleBlur}
																			onChange={(e) =>
																				nameField.handleChange(e.target.value)
																			}
																			className="flex-1"
																		/>
																	)}
																</form.Field>
																<form.Field
																	name={`choices[${index}].priceModifier`}
																>
																	{(priceField) => (
																		<PriceInput
																			value={priceField.state.value}
																			onChange={priceField.handleChange}
																			onBlur={priceField.handleBlur}
																			className="w-32"
																		/>
																	)}
																</form.Field>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	onClick={() => field.removeValue(index)}
																	className="shrink-0 text-muted-foreground hover:text-destructive"
																>
																	<X className="h-4 w-4" />
																</Button>
															</div>

															{/* Choice options row */}
															<div className="flex items-center gap-4 pl-2">
																{/* Default checkbox */}
																<form.Field
																	name={`choices[${index}].isDefault`}
																>
																	{(defaultField) => (
																		<div className="flex items-center gap-2 text-sm">
																			<Checkbox
																				id={`${id}-choice-${index}-default`}
																				checked={defaultField.state.value}
																				onCheckedChange={(checked) =>
																					defaultField.handleChange(
																						checked === true,
																					)
																				}
																			/>
																			<label
																				htmlFor={`${id}-choice-${index}-default`}
																			>
																				{t("labels.defaultSelected")}
																			</label>
																		</div>
																	)}
																</form.Field>

																{/* Quantity limits for quantity_select type */}
																{type === "quantity_select" && (
																	<>
																		<form.Field
																			name={`choices[${index}].minQuantity`}
																		>
																			{(minQtyField) => (
																				<div className="flex items-center gap-1">
																					<span className="text-xs text-muted-foreground">
																						{t("labels.minQty")}:
																					</span>
																					<Input
																						type="number"
																						min={0}
																						className="w-16 h-8"
																						value={minQtyField.state.value}
																						onChange={(e) =>
																							minQtyField.handleChange(
																								Number.parseInt(
																									e.target.value,
																									10,
																								) || 0,
																							)
																						}
																					/>
																				</div>
																			)}
																		</form.Field>
																		<form.Field
																			name={`choices[${index}].maxQuantity`}
																		>
																			{(maxQtyField) => (
																				<div className="flex items-center gap-1">
																					<span className="text-xs text-muted-foreground">
																						{t("labels.maxQty")}:
																					</span>
																					<Input
																						type="number"
																						min={1}
																						className="w-16 h-8"
																						value={
																							maxQtyField.state.value ?? ""
																						}
																						onChange={(e) =>
																							maxQtyField.handleChange(
																								e.target.value
																									? Number.parseInt(
																											e.target.value,
																											10,
																										)
																									: null,
																							)
																						}
																						placeholder="∞"
																					/>
																				</div>
																			)}
																		</form.Field>
																	</>
																)}
															</div>
														</div>
													))
												)}

												<Button
													type="button"
													variant="outline"
													onClick={() =>
														field.pushValue({
															name: "",
															priceModifier: 0,
															isDefault: false,
															minQuantity: 0,
															maxQuantity: null,
														})
													}
													className="w-full"
												>
													{t("actions.addChoice")}
												</Button>
											</div>
										)}
									</form.Field>
								)}
							</form.Subscribe>
						</TabsContent>
					</Tabs>

					<DialogFooter className="mt-4">
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
									<Button type="submit" disabled={isSubmitting || !canSubmit}>
										{isSubmitting
											? isEditing
												? tCommon("states.saving")
												: tCommon("states.creating")
											: isEditing
												? tCommon("buttons.saveChanges")
												: t("buttons.createOptionGroup")}
									</Button>
								</>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

// Export form values type for parent component use
export type OptionGroupFormValues = {
	name: string;
	description: string;
	type: OptionGroupType;
	minSelections: number;
	maxSelections: number | null;
	isUnlimited: boolean;
	numFreeOptions: number;
	aggregateMinQuantity: number | null;
	aggregateMaxQuantity: number | null;
	choices: Array<{
		id?: number;
		name: string;
		priceModifier: number;
		isDefault: boolean;
		minQuantity: number;
		maxQuantity: number | null;
	}>;
};
