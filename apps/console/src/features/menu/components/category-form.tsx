import type { AppRouter } from "@menuvo/api/trpc";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	Calendar,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	Input,
	LoadingButton,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Separator,
	Switch,
	Textarea,
	TimeInput,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { cn } from "@/lib/utils.ts";
import { getLocalizedContent } from "../logic/localization";
import { categoryFormSchema, formToTranslations } from "../schemas";
import { VatGroupSelector } from "./vat-group-selector";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Category = NonNullable<RouterOutput["menu"]["categories"]["getById"]>;

interface CategoryFormProps {
	storeId: string;
	category?: Category;
}

export function CategoryForm({ storeId, category }: CategoryFormProps) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const { t: tForms } = useTranslation("forms");
	const navigate = useNavigate();

	const isEditing = !!category;
	const language = "de"; // Primary language

	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t: tToasts } = useTranslation("toasts");

	// Get initial values from category data (for edit mode)
	const initialContent = category
		? getLocalizedContent(category.translations, language, language)
		: { name: "", description: "" };

	// Initialize availability schedule from category
	const initialSchedule = category?.availabilitySchedule
		? {
				enabled: category.availabilitySchedule.enabled,
				timeRange: category.availabilitySchedule.timeRange as
					| { startTime: string; endTime: string }
					| undefined,
				daysOfWeek: (category.availabilitySchedule.daysOfWeek ??
					[]) as DayOfWeek[],
				dateRange: category.availabilitySchedule.dateRange as
					| { startDate: string; endDate: string }
					| undefined,
			}
		: {
				enabled: false,
				timeRange: undefined as undefined,
				daysOfWeek: [] as DayOfWeek[],
				dateRange: undefined as undefined,
			};

	type RouterInput = inferRouterInputs<AppRouter>;
	type CreateCategoryInput = RouterInput["menu"]["categories"]["create"];

	const createMutation = useMutation({
		mutationKey: trpc.menu.categories.create.mutationKey(),
		mutationFn: async (input: Omit<CreateCategoryInput, "storeId">) =>
			trpcClient.menu.categories.create.mutate({
				storeId,
				...input,
			}),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: trpc.menu.queries.getCategories.queryKey({ storeId }),
			});
			toast.success(tToasts("success.categoryCreated"));
		},
		onError: () => {
			toast.error(tToasts("error.createCategory"));
		},
	});

	type UpdateCategoryInput = RouterInput["menu"]["categories"]["update"];

	const updateMutation = useMutation({
		mutationKey: trpc.menu.categories.update.mutationKey(),
		mutationFn: async (input: UpdateCategoryInput) =>
			trpcClient.menu.categories.update.mutate(input),
		onSuccess: async (_, variables) => {
			await queryClient.invalidateQueries({
				queryKey: trpc.menu.queries.getCategories.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.menu.categories.getById.queryKey({
					id: variables.id,
				}),
			});
			toast.success(tToasts("success.categoryUpdated"));
		},
		onError: () => {
			toast.error(tToasts("error.updateCategory"));
		},
	});

	const form = useForm({
		defaultValues: {
			name: initialContent.name,
			description: initialContent.description ?? "",
			defaultVatGroupId: category?.defaultVatGroupId ?? null,
			availabilitySchedule: initialSchedule,
		},
		validators: {
			onSubmit: categoryFormSchema,
		},
		onSubmit: async ({ value }) => {
			const translations = formToTranslations(
				value,
				language,
				category?.translations ?? {},
			);

			// Build availability schedule
			const schedule = value.availabilitySchedule;
			const availabilitySchedule =
				schedule.enabled &&
				(schedule.timeRange ||
					schedule.daysOfWeek?.length ||
					schedule.dateRange)
					? {
							enabled: true,
							timeRange: schedule.timeRange,
							daysOfWeek:
								schedule.daysOfWeek && schedule.daysOfWeek.length > 0
									? schedule.daysOfWeek
									: undefined,
							dateRange: schedule.dateRange,
						}
					: null;

			if (isEditing && category) {
				await updateMutation.mutateAsync({
					id: category.id,
					translations,
					defaultVatGroupId: value.defaultVatGroupId,
					availabilitySchedule,
				});
			} else {
				await createMutation.mutateAsync({
					translations,
					defaultVatGroupId: value.defaultVatGroupId ?? undefined,
					availabilitySchedule: availabilitySchedule ?? undefined,
				});
			}

			// Navigate back to categories list
			navigate({
				to: "/stores/$storeId/menu",
				params: { storeId },
			});
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{isEditing ? t("titles.editCategory") : t("titles.addCategory")}
				</CardTitle>
				<CardDescription>
					{isEditing
						? t("dialogs.updateCategoryDescription")
						: t("dialogs.createCategoryDescription")}
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
						</form.Field>

						<form.Field name="description">
							{(field) => {
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
						</form.Field>

						<form.Field name="defaultVatGroupId">
							{(field) => (
								<Field>
									<FieldLabel htmlFor="category-vat-group">
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
											showClearOption
										/>
									</Suspense>
									<FieldDescription>
										{t("vat.hints.defaultVatGroup")}
									</FieldDescription>
								</Field>
							)}
						</form.Field>
					</FieldGroup>

					<Separator className="my-6" />

					<form.Field name="availabilitySchedule">
						{(field) => (
							<AvailabilityScheduleSection
								value={field.state.value}
								onChange={field.handleChange}
							/>
						)}
					</form.Field>

					<div className="mt-6 flex justify-end gap-3">
						<Button type="button" variant="outline" asChild>
							<Link to="/stores/$storeId/menu" params={{ storeId }}>
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
										: t("buttons.createCategory")}
								</LoadingButton>
							)}
						</form.Subscribe>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}

type DayOfWeek =
	| "monday"
	| "tuesday"
	| "wednesday"
	| "thursday"
	| "friday"
	| "saturday"
	| "sunday";

interface AvailabilityScheduleSectionProps {
	value: {
		enabled: boolean;
		timeRange: { startTime: string; endTime: string } | undefined;
		daysOfWeek: DayOfWeek[];
		dateRange: { startDate: string; endDate: string } | undefined;
	};
	onChange: (value: AvailabilityScheduleSectionProps["value"]) => void;
}

const DAYS_OF_WEEK = [
	{ value: "monday", label: "Monday" },
	{ value: "tuesday", label: "Tuesday" },
	{ value: "wednesday", label: "Wednesday" },
	{ value: "thursday", label: "Thursday" },
	{ value: "friday", label: "Friday" },
	{ value: "saturday", label: "Saturday" },
	{ value: "sunday", label: "Sunday" },
] as const;

function AvailabilityScheduleSection({
	value,
	onChange,
}: AvailabilityScheduleSectionProps) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");

	// Get translated day abbreviations
	const getDayLabel = (dayValue: string): string => {
		const dayMap: Record<string, string> = {
			monday: tCommon("days.mondayShort"),
			tuesday: tCommon("days.tuesdayShort"),
			wednesday: tCommon("days.wednesdayShort"),
			thursday: tCommon("days.thursdayShort"),
			friday: tCommon("days.fridayShort"),
			saturday: tCommon("days.saturdayShort"),
			sunday: tCommon("days.sundayShort"),
		};
		return dayMap[dayValue] || dayValue;
	};
	const [accordionValue, setAccordionValue] = useState<string>(
		value.enabled ||
			!!value.timeRange ||
			!!value.daysOfWeek?.length ||
			!!value.dateRange
			? "schedule"
			: "",
	);

	// Auto-expand when enabled
	useEffect(() => {
		if (value.enabled && accordionValue !== "schedule") {
			setAccordionValue("schedule");
		}
	}, [value.enabled, accordionValue]);

	const handleToggleEnabled = (enabled: boolean) => {
		onChange({
			enabled,
			timeRange: enabled ? value.timeRange : undefined,
			daysOfWeek: enabled ? value.daysOfWeek : [],
			dateRange: enabled ? value.dateRange : undefined,
		});
	};

	const handleTimeRangeChange = (
		field: "startTime" | "endTime",
		time: string,
	) => {
		onChange({
			enabled: value.enabled,
			timeRange: {
				startTime:
					field === "startTime"
						? time
						: (value.timeRange?.startTime ?? "09:00"),
				endTime:
					field === "endTime" ? time : (value.timeRange?.endTime ?? "17:00"),
			},
			daysOfWeek: value.daysOfWeek,
			dateRange: value.dateRange,
		});
	};

	const handleDayToggle = (day: DayOfWeek) => {
		const currentDays = value.daysOfWeek ?? [];
		const newDays = currentDays.includes(day)
			? currentDays.filter((d) => d !== day)
			: ([...currentDays, day] as DayOfWeek[]);
		onChange({
			enabled: value.enabled,
			timeRange: value.timeRange,
			daysOfWeek: newDays,
			dateRange: value.dateRange,
		});
	};

	const handleDateRangeChange = (
		field: "startDate" | "endDate",
		date: string,
	) => {
		onChange({
			enabled: value.enabled,
			timeRange: value.timeRange,
			daysOfWeek: value.daysOfWeek,
			dateRange: {
				startDate:
					field === "startDate"
						? date
						: (value.dateRange?.startDate ?? format(new Date(), "yyyy-MM-dd")),
				endDate:
					field === "endDate"
						? date
						: (value.dateRange?.endDate ?? format(new Date(), "yyyy-MM-dd")),
			},
		});
	};

	const handleClear = () => {
		onChange({
			enabled: false,
			timeRange: undefined,
			daysOfWeek: [],
			dateRange: undefined,
		});
		setAccordionValue("");
	};

	// Generate summary text for collapsed state
	const getSummary = (): string => {
		if (!value.enabled) {
			return t("availability.notConfigured", "Not configured");
		}

		const parts: string[] = [];

		if (value.timeRange) {
			parts.push(`${value.timeRange.startTime}-${value.timeRange.endTime}`);
		}

		if (value.daysOfWeek && value.daysOfWeek.length > 0) {
			const dayLabels = value.daysOfWeek.map(
				(day) => DAYS_OF_WEEK.find((d) => d.value === day)?.label ?? day,
			);
			if (dayLabels.length === 7) {
				parts.push(tCommon("labels.allDays", "All days"));
			} else if (dayLabels.length <= 3) {
				parts.push(dayLabels.join(", "));
			} else {
				parts.push(
					t("availability.daysCount", "{{count}} days", {
						count: dayLabels.length,
					}),
				);
			}
		}

		if (value.dateRange) {
			const start = format(parseISO(value.dateRange.startDate), "MMM d");
			const end = format(parseISO(value.dateRange.endDate), "MMM d");
			parts.push(`${start} - ${end}`);
		}

		return parts.length > 0
			? parts.join(" • ")
			: t("availability.enabledNoRules", "Enabled (no rules set)");
	};

	return (
		<Accordion
			type="single"
			collapsible
			value={accordionValue}
			onValueChange={(val) => setAccordionValue(val ?? "")}
			className="w-full"
		>
			<AccordionItem value="schedule" className="border-none">
				<div className="rounded-lg border">
					<div className="flex items-center justify-between px-4 py-3">
						<AccordionTrigger className="flex-1 p-0 hover:no-underline [&>svg]:hidden">
							<div className="flex items-center gap-3">
								<FieldLabel>
									{t("availability.title", "Availability Schedule")}
								</FieldLabel>
								{accordionValue !== "schedule" && value.enabled && (
									<span className="text-muted-foreground text-sm">
										{getSummary()}
									</span>
								)}
							</div>
						</AccordionTrigger>
						<div className="flex items-center gap-2">
							<Switch
								checked={value.enabled}
								onCheckedChange={handleToggleEnabled}
								id="availability-enabled"
							/>
							<FieldLabel htmlFor="availability-enabled">
								{tCommon("labels.enabled")}
							</FieldLabel>
						</div>
					</div>
					<AccordionContent className="px-4 pb-4">
						<div className="space-y-4 pt-2">
							<FieldDescription>
								{t(
									"availability.description",
									"Control when this category is visible to customers. All rules must be satisfied for the category to show.",
								)}
							</FieldDescription>

							{value.enabled && (
								<>
									{/* Time Range */}
									<Field>
										<FieldLabel>
											{t("availability.timeRange", "Time Range")} (
											{tCommon("labels.optional")})
										</FieldLabel>
										<div className="flex items-center gap-3">
											<div className="flex-1">
												<TimeInput
													value={value.timeRange?.startTime ?? "09:00"}
													onChange={(time) =>
														handleTimeRangeChange("startTime", time)
													}
													disabled={!value.enabled}
												/>
											</div>
											<span className="text-muted-foreground">
												{tCommon("labels.to")}
											</span>
											<div className="flex-1">
												<TimeInput
													value={value.timeRange?.endTime ?? "17:00"}
													onChange={(time) =>
														handleTimeRangeChange("endTime", time)
													}
													disabled={!value.enabled}
												/>
											</div>
										</div>
										<FieldDescription>
											{t(
												"availability.timeRangeHint",
												"Leave empty to apply to all times. Supports midnight crossover (e.g., 22:00-02:00).",
											)}
										</FieldDescription>
									</Field>

									{/* Days of Week */}
									<Field>
										<FieldLabel>
											{t("availability.daysOfWeek", "Days of Week")} (
											{tCommon("labels.optional")})
										</FieldLabel>
										<div className="flex flex-wrap gap-3">
											{DAYS_OF_WEEK.map((day) => (
												<label
													key={day.value}
													htmlFor={`day-${day.value}`}
													className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 hover:bg-muted"
												>
													<Checkbox
														id={`day-${day.value}`}
														checked={
															value.daysOfWeek?.includes(
																day.value as DayOfWeek,
															) ?? false
														}
														onCheckedChange={() =>
															handleDayToggle(day.value as DayOfWeek)
														}
														disabled={!value.enabled}
													/>
													<span className="text-sm">
														{getDayLabel(day.value)}
													</span>
												</label>
											))}
										</div>
										<FieldDescription>
											{t(
												"availability.daysHint",
												"Leave empty to apply to all days.",
											)}
										</FieldDescription>
									</Field>

									{/* Date Range */}
									<div className="grid gap-4 sm:grid-cols-2">
										<Field>
											<FieldLabel>
												{t("availability.startDate", "Start Date")} (
												{tCommon("labels.optional")})
											</FieldLabel>
											<DatePickerInput
												value={value.dateRange?.startDate}
												onChange={(date) =>
													handleDateRangeChange("startDate", date)
												}
												disabled={!value.enabled}
											/>
										</Field>
										<Field>
											<FieldLabel>
												{t("availability.endDate", "End Date")} (
												{tCommon("labels.optional")})
											</FieldLabel>
											<DatePickerInput
												value={value.dateRange?.endDate}
												onChange={(date) =>
													handleDateRangeChange("endDate", date)
												}
												disabled={!value.enabled}
											/>
										</Field>
									</div>

									{/* Clear Button */}
									<div className="flex justify-end">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleClear}
										>
											{tCommon("buttons.clear")}
										</Button>
									</div>
								</>
							)}
						</div>
					</AccordionContent>
				</div>
			</AccordionItem>
		</Accordion>
	);
}

interface DatePickerInputProps {
	value?: string;
	onChange: (date: string) => void;
	disabled?: boolean;
}

function DatePickerInput({ value, onChange, disabled }: DatePickerInputProps) {
	const { t } = useTranslation("settings");
	const [open, setOpen] = useState(false);
	const date = value ? parseISO(value) : undefined;

	const handleSelect = (selectedDate: Date | undefined) => {
		if (selectedDate) {
			onChange(format(selectedDate, "yyyy-MM-dd"));
			setOpen(false);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className={cn(
						"w-full justify-start text-start font-normal",
						!date && "text-muted-foreground",
					)}
					disabled={disabled}
				>
					<CalendarIcon className="me-2 size-4" />
					{date ? (
						format(date, "PPP")
					) : (
						<span>{t("placeholders.pickDate", "Pick a date")}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={date}
					onSelect={handleSelect}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
