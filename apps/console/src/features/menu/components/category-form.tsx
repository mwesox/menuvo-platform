import {
	Box,
	Button,
	Card,
	Checkbox,
	Field,
	HStack,
	Input,
	Popover,
	Portal,
	Separator,
	SimpleGrid,
	Skeleton,
	Switch,
	Text,
	Textarea,
	VStack,
} from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { FormField } from "@/components/ui/form-field";
import { TimeInput } from "@/components/ui/time-input";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
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
		<Card.Root>
			<Card.Header>
				<Card.Title>
					{isEditing ? t("titles.editCategory") : t("titles.addCategory")}
				</Card.Title>
				<Card.Description>
					{isEditing
						? t("dialogs.updateCategoryDescription")
						: t("dialogs.createCategoryDescription")}
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
										id="category-name"
										name={field.name}
										placeholder={t("placeholders.categoryName")}
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
										id="category-description"
										name={field.name}
										placeholder={t("placeholders.categoryDescription")}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										rows={3}
									/>
								</FormField>
							)}
						</form.Field>

						<form.Field name="defaultVatGroupId">
							{(field) => (
								<Field.Root>
									<Field.Label
										htmlFor="category-vat-group"
										textStyle="sm"
										fontWeight="medium"
									>
										{t("vat.labels.vatGroup")}
									</Field.Label>
									<Suspense fallback={<Skeleton h="10" rounded="md" />}>
										<VatGroupSelector
											value={field.state.value}
											onChange={(value) => field.handleChange(value)}
											showClearOption
										/>
									</Suspense>
									<Field.HelperText textStyle="sm" color="fg.muted">
										{t("vat.hints.defaultVatGroup")}
									</Field.HelperText>
								</Field.Root>
							)}
						</form.Field>
					</VStack>

					<Separator my="6" />

					<form.Field name="availabilitySchedule">
						{(field) => (
							<AvailabilityScheduleSection
								value={field.state.value}
								onChange={field.handleChange}
							/>
						)}
					</form.Field>

					<HStack mt="6" justify="flex-end" gap="3">
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
										: t("buttons.createCategory")}
								</Button>
							)}
						</form.Subscribe>
					</HStack>
				</form>
			</Card.Body>
		</Card.Root>
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
	};

	return (
		<Box rounded="lg" borderWidth="1px">
			<VStack gap="4" align="stretch" p="4">
				<HStack justify="space-between" align="center">
					<Text fontWeight="medium" textStyle="sm">
						{t("availability.title", "Availability Schedule")}
					</Text>
					<HStack gap="2" align="center">
						<Switch.Root
							checked={value.enabled}
							onCheckedChange={(e) => handleToggleEnabled(e.checked)}
							id="availability-enabled"
							colorPalette="red"
						>
							<Switch.HiddenInput />
							<Switch.Control />
						</Switch.Root>
						<Text as="span" cursor="pointer" textStyle="sm">
							{tCommon("labels.enabled")}
						</Text>
					</HStack>
				</HStack>

				<Text color="fg.muted" textStyle="sm">
					{t(
						"availability.description",
						"Control when this category is visible to customers. All rules must be satisfied for the category to show.",
					)}
				</Text>

				{value.enabled && (
					<>
						{/* Time Range */}
						<Field.Root>
							<Field.Label textStyle="sm" fontWeight="medium">
								{t("availability.timeRange", "Time Range")} (
								{tCommon("labels.optional")})
							</Field.Label>
							<HStack gap="3" align="center">
								<Box flex="1">
									<TimeInput
										value={value.timeRange?.startTime ?? "09:00"}
										onChange={(time) =>
											handleTimeRangeChange("startTime", time)
										}
										disabled={!value.enabled}
									/>
								</Box>
								<Text color="fg.muted">{tCommon("labels.to")}</Text>
								<Box flex="1">
									<TimeInput
										value={value.timeRange?.endTime ?? "17:00"}
										onChange={(time) => handleTimeRangeChange("endTime", time)}
										disabled={!value.enabled}
									/>
								</Box>
							</HStack>
							<Field.HelperText textStyle="sm" color="fg.muted">
								{t(
									"availability.timeRangeHint",
									"Leave empty to apply to all times. Supports midnight crossover (e.g., 22:00-02:00).",
								)}
							</Field.HelperText>
						</Field.Root>

						{/* Days of Week */}
						<Field.Root>
							<Field.Label textStyle="sm" fontWeight="medium">
								{t("availability.daysOfWeek", "Days of Week")} (
								{tCommon("labels.optional")})
							</Field.Label>
							<HStack gap="3" wrap="wrap">
								{DAYS_OF_WEEK.map((day) => (
									<Checkbox.Root
										key={day.value}
										id={`day-${day.value}`}
										checked={
											value.daysOfWeek?.includes(day.value as DayOfWeek) ??
											false
										}
										onCheckedChange={() =>
											handleDayToggle(day.value as DayOfWeek)
										}
										disabled={!value.enabled}
										display="flex"
										alignItems="center"
										gap="2"
										rounded="md"
										borderWidth="1px"
										px="3"
										py="2"
										cursor="pointer"
										_hover={{ bg: "bg.muted" }}
									>
										<Checkbox.HiddenInput />
										<Checkbox.Control />
										<Checkbox.Label textStyle="sm">
											{getDayLabel(day.value)}
										</Checkbox.Label>
									</Checkbox.Root>
								))}
							</HStack>
							<Field.HelperText textStyle="sm" color="fg.muted">
								{t(
									"availability.daysHint",
									"Leave empty to apply to all days.",
								)}
							</Field.HelperText>
						</Field.Root>

						{/* Date Range */}
						<SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
							<Field.Root>
								<Field.Label textStyle="sm" fontWeight="medium">
									{t("availability.startDate", "Start Date")} (
									{tCommon("labels.optional")})
								</Field.Label>
								<DatePickerInput
									value={value.dateRange?.startDate}
									onChange={(date) => handleDateRangeChange("startDate", date)}
									disabled={!value.enabled}
								/>
							</Field.Root>
							<Field.Root>
								<Field.Label textStyle="sm" fontWeight="medium">
									{t("availability.endDate", "End Date")} (
									{tCommon("labels.optional")})
								</Field.Label>
								<DatePickerInput
									value={value.dateRange?.endDate}
									onChange={(date) => handleDateRangeChange("endDate", date)}
									disabled={!value.enabled}
								/>
							</Field.Root>
						</SimpleGrid>

						{/* Clear Button */}
						<HStack justify="flex-end">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleClear}
							>
								{tCommon("buttons.clear")}
							</Button>
						</HStack>
					</>
				)}
			</VStack>
		</Box>
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
		<Popover.Root
			open={open}
			onOpenChange={(e) => setOpen(e.open)}
			positioning={{ placement: "bottom-start" }}
		>
			<Popover.Trigger asChild>
				<Button
					type="button"
					variant="outline"
					w="full"
					justifyContent="flex-start"
					textAlign="start"
					fontWeight="normal"
					color={!date ? "fg.muted" : undefined}
					disabled={disabled}
				>
					<CalendarIcon
						style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }}
					/>
					{date
						? format(date, "PPP")
						: t("placeholders.pickDate", "Pick a date")}
				</Button>
			</Popover.Trigger>
			<Portal>
				<Popover.Positioner>
					<Popover.Content w="auto" p="0">
						<Calendar
							mode="single"
							selected={date}
							onSelect={handleSelect}
							initialFocus
						/>
					</Popover.Content>
				</Popover.Positioner>
			</Portal>
		</Popover.Root>
	);
}
