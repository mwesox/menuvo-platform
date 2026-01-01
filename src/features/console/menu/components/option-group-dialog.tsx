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
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import type { OptionChoice, OptionGroup } from "@/db/schema.ts";
import { optionGroupFormSchema } from "../options.validation.ts";

interface OptionGroupDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	optionGroup?: (OptionGroup & { optionChoices: OptionChoice[] }) | null;
	onSave: (data: {
		name: string;
		description?: string;
		isRequired: boolean;
		minSelections: number;
		maxSelections: number | null;
		choices: Array<{ id?: number; name: string; priceModifier: number }>;
	}) => Promise<void>;
}

function centsToEuros(cents: number): string {
	return (cents / 100).toFixed(2);
}

function eurosToCents(euros: string): number {
	const parsed = Number.parseFloat(euros);
	if (Number.isNaN(parsed)) return 0;
	return Math.round(parsed * 100);
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
			isRequired: false,
			minSelections: 0,
			maxSelections: null as number | null,
			isUnlimited: true,
			choices: [] as Array<{
				id?: number;
				name: string;
				priceModifier: string;
			}>,
		},
		validators: {
			onSubmit: optionGroupFormSchema,
		},
		onSubmit: async ({ value }) => {
			await onSave({
				name: value.name,
				description: value.description || undefined,
				isRequired: value.isRequired,
				minSelections: value.minSelections,
				maxSelections: value.isUnlimited ? null : value.maxSelections,
				choices: value.choices.map((choice) => ({
					id: choice.id,
					name: choice.name,
					priceModifier: eurosToCents(choice.priceModifier),
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
				form.setFieldValue("isRequired", optionGroup.isRequired);
				form.setFieldValue("minSelections", optionGroup.minSelections);
				form.setFieldValue("maxSelections", optionGroup.maxSelections);
				form.setFieldValue("isUnlimited", optionGroup.maxSelections === null);
				form.setFieldValue(
					"choices",
					optionGroup.optionChoices.map((choice) => ({
						id: choice.id,
						name: choice.name,
						priceModifier: centsToEuros(choice.priceModifier),
					})),
				);
			}
			setActiveTab("settings");
		}
	}, [open, optionGroup]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
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

								<form.Field name="isRequired">
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched && !field.state.meta.isValid;
										return (
											<Field
												orientation="horizontal"
												data-invalid={isInvalid}
												className="rounded-lg border p-3"
											>
												<FieldContent>
													<FieldLabel htmlFor={`${id}-required`}>
														{t("labels.required")}
													</FieldLabel>
													<FieldDescription>
														{t("descriptions.requiredField")}
													</FieldDescription>
												</FieldContent>
												<Switch
													id={`${id}-required`}
													checked={field.state.value}
													onCheckedChange={field.handleChange}
												/>
											</Field>
										);
									}}
								</form.Field>

								<div className="grid grid-cols-2 gap-4">
									<form.Field name="minSelections">
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched && !field.state.meta.isValid;
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
																Number.parseInt(e.target.value, 10) || 0,
															)
														}
														aria-invalid={isInvalid}
													/>
													{isInvalid && (
														<FieldError errors={field.state.meta.errors} />
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
															<FieldLabel htmlFor={`${id}-max-selections`}>
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
																		Number.parseInt(e.target.value, 10) || 1,
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
																			checked={unlimitedField.state.value}
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
																<FieldError errors={field.state.meta.errors} />
															)}
														</Field>
													);
												}}
											</form.Field>
										)}
									</form.Subscribe>
								</div>
							</FieldGroup>
						</TabsContent>

						<TabsContent value="choices" className="py-4">
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
													className="flex items-center gap-2"
												>
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
													<form.Field name={`choices[${index}].priceModifier`}>
														{(priceField) => (
															<div className="relative w-24">
																<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
																	EUR
																</span>
																<Input
																	type="number"
																	step="0.01"
																	placeholder="0.00"
																	value={priceField.state.value}
																	onBlur={priceField.handleBlur}
																	onChange={(e) =>
																		priceField.handleChange(e.target.value)
																	}
																	className="pl-11"
																/>
															</div>
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
											))
										)}

										<Button
											type="button"
											variant="outline"
											onClick={() =>
												field.pushValue({ name: "", priceModifier: "0.00" })
											}
											className="w-full"
										>
											{t("actions.addChoice")}
										</Button>
									</div>
								)}
							</form.Field>
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
