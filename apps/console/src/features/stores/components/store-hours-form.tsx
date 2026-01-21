import {
	Badge,
	Button,
	HStack,
	Icon,
	Separator,
	Switch,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SettingsFormFooter } from "@/components/layout/settings-form-footer";
import { FormSection } from "@/components/ui/form-section";
import { TimeInput } from "@/components/ui/time-input";
import {
	type DayHoursInput,
	daysOfWeek,
	storeHoursFormSchema,
} from "@/features/stores/hours-validation.ts";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

type RouterOutput = inferRouterOutputs<AppRouter>;
type StoreHour = RouterOutput["store"]["hours"]["get"][number];
type DayOfWeek = (typeof daysOfWeek)[number];

interface StoreHoursFormProps {
	storeId: string;
}

// Transform database hours to form format (grouped by day)
function transformToWeekHours(hours: StoreHour[]): DayHoursInput[] {
	const hoursByDay = new Map<DayOfWeek, StoreHour[]>();

	// Group hours by day
	for (const hour of hours) {
		const dayHours = hoursByDay.get(hour.dayOfWeek as DayOfWeek) ?? [];
		dayHours.push(hour);
		hoursByDay.set(hour.dayOfWeek as DayOfWeek, dayHours);
	}

	// Create week structure
	return daysOfWeek.map((day) => {
		const dayHours = hoursByDay.get(day) ?? [];
		return {
			dayOfWeek: day,
			isOpen: dayHours.length > 0,
			slots: dayHours
				.sort((a, b) => a.displayOrder - b.displayOrder)
				.map((h) => ({
					openTime: h.openTime,
					closeTime: h.closeTime,
				})),
		};
	});
}

// Transform form data back to flat array for API
function transformToHoursArray(weekHours: DayHoursInput[]): Array<{
	dayOfWeek: DayOfWeek;
	openTime: string;
	closeTime: string;
	displayOrder: number;
}> {
	const result: Array<{
		dayOfWeek: DayOfWeek;
		openTime: string;
		closeTime: string;
		displayOrder: number;
	}> = [];

	for (const day of weekHours) {
		if (!day.isOpen) continue;
		for (let i = 0; i < day.slots.length; i++) {
			const slot = day.slots[i];
			if (!slot) continue;
			result.push({
				dayOfWeek: day.dayOfWeek,
				openTime: slot.openTime,
				closeTime: slot.closeTime,
				displayOrder: i,
			});
		}
	}

	return result;
}

export function StoreHoursForm({ storeId }: StoreHoursFormProps) {
	const { t } = useTranslation("settings");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { data: hours = [] } = useQuery({
		...trpc.store.hours.get.queryOptions({ storeId }),
	});

	type RouterInput = inferRouterInputs<AppRouter>;
	type SaveStoreHoursInput = RouterInput["store"]["hours"]["save"];

	const saveMutation = useMutation({
		mutationKey: trpc.store.hours.save.mutationKey(),
		mutationFn: async (input: SaveStoreHoursInput) =>
			trpcClient.store.hours.save.mutate(input),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.hours.get.queryKey({ storeId: variables.storeId }),
			});
			toast.success(tToasts("success.hoursUpdated"));
		},
		onError: () => {
			toast.error(tToasts("error.updateHours"));
		},
	});

	const defaultValues = useMemo(() => transformToWeekHours(hours), [hours]);

	const form = useForm({
		defaultValues: {
			weekHours: defaultValues,
		},
		validators: {
			onSubmit: storeHoursFormSchema,
		},
		onSubmit: async ({ value }) => {
			const hoursArray = transformToHoursArray(value.weekHours);
			await saveMutation.mutateAsync({
				storeId,
				hours: hoursArray,
			});
		},
	});

	// Reset form when hours change
	useEffect(() => {
		form.reset({
			weekHours: defaultValues,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [defaultValues]);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
		>
			<VStack gap="6" align="stretch" w="full">
				<FormSection
					title={t("sections.openingHours")}
					description={t("descriptions.openingHours")}
				>
					{/* Days list */}
					<VStack align="stretch" gap="0" separator={<Separator />}>
						{daysOfWeek.map((day, dayIndex) => (
							<form.Field key={day} name={`weekHours[${dayIndex}]`}>
								{(field) => (
									<DayRow
										day={day}
										value={field.state.value as DayHoursInput}
										onChange={field.handleChange}
									/>
								)}
							</form.Field>
						))}
					</VStack>
				</FormSection>

				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => <SettingsFormFooter isSubmitting={isSubmitting} />}
				</form.Subscribe>
			</VStack>
		</form>
	);
}

interface DayRowProps {
	day: (typeof daysOfWeek)[number];
	value: DayHoursInput;
	onChange: (value: DayHoursInput) => void;
}

function DayRow({ day, value, onChange }: DayRowProps) {
	const { t } = useTranslation("settings");
	const { t: tCommon } = useTranslation("common");

	const handleToggle = useCallback(
		(isOpen: boolean) => {
			onChange({
				...value,
				isOpen,
				slots:
					isOpen && value.slots.length === 0
						? [{ openTime: "09:00", closeTime: "17:00" }]
						: value.slots,
			});
		},
		[value, onChange],
	);

	const handleSlotChange = useCallback(
		(slotIndex: number, field: "openTime" | "closeTime", newValue: string) => {
			const newSlots = [...value.slots];
			const existingSlot = newSlots[slotIndex];
			if (!existingSlot) return;
			newSlots[slotIndex] = {
				openTime: field === "openTime" ? newValue : existingSlot.openTime,
				closeTime: field === "closeTime" ? newValue : existingSlot.closeTime,
			};
			onChange({ ...value, slots: newSlots });
		},
		[value, onChange],
	);

	const handleAddSlot = useCallback(() => {
		const lastSlot = value.slots[value.slots.length - 1];
		const newOpenTime = lastSlot ? lastSlot.closeTime : "09:00";
		onChange({
			...value,
			slots: [...value.slots, { openTime: newOpenTime, closeTime: "17:00" }],
		});
	}, [value, onChange]);

	const handleRemoveSlot = useCallback(
		(slotIndex: number) => {
			const newSlots = value.slots.filter((_, i) => i !== slotIndex);
			onChange({
				...value,
				isOpen: newSlots.length > 0,
				slots: newSlots,
			});
		},
		[value, onChange],
	);

	const showDeleteButton = value.slots.length > 1;
	const switchId = `${day}-toggle`;

	return (
		<HStack
			py="4"
			gap={{ base: "4", md: "8" }}
			align="flex-start"
			flexWrap={{ base: "wrap", md: "nowrap" }}
			opacity={value.isOpen ? 1 : 0.7}
		>
			{/* Day switch - fixed width for alignment */}
			<HStack gap="3" w={{ base: "full", md: "160px" }} flexShrink={0}>
				<Switch.Root
					id={switchId}
					checked={value.isOpen}
					onCheckedChange={(e) => handleToggle(e.checked)}
					colorPalette="red"
				>
					<Switch.HiddenInput />
					<Switch.Control>
						<Switch.Thumb />
					</Switch.Control>
					<Switch.Label fontWeight="medium" cursor="pointer">
						{tCommon(`days.${day}`)}
					</Switch.Label>
				</Switch.Root>
			</HStack>

			{/* Time slots or closed badge */}
			{value.isOpen ? (
				<VStack gap="2" align="stretch" flex="1">
					{value.slots.map((slot, slotIndex) => (
						<HStack
							key={`${slot.openTime}-${slot.closeTime}-${slotIndex}`}
							gap="2"
							align="center"
						>
							<TimeInput
								value={slot.openTime}
								onChange={(val) => handleSlotChange(slotIndex, "openTime", val)}
							/>
							<Text color="fg.muted" textStyle="sm">
								–
							</Text>
							<TimeInput
								value={slot.closeTime}
								onChange={(val) =>
									handleSlotChange(slotIndex, "closeTime", val)
								}
							/>
							{showDeleteButton && (
								<Button
									type="button"
									variant="ghost"
									size="xs"
									aria-label={tCommon("buttons.delete")}
									onClick={() => handleRemoveSlot(slotIndex)}
								>
									<Icon fontSize="sm">
										<Trash2 />
									</Icon>
								</Button>
							)}
						</HStack>
					))}
					<Button
						type="button"
						variant="ghost"
						size="sm"
						aria-label={t("actions.addTimeSlot")}
						onClick={handleAddSlot}
						alignSelf="flex-start"
					>
						<Icon fontSize="sm">
							<Plus />
						</Icon>
						<Text hideBelow="sm">{t("actions.addTimeSlot")}</Text>
					</Button>
				</VStack>
			) : (
				<Badge variant="outline" colorPalette="gray" size="sm">
					{tCommon("labels.closed")}
				</Badge>
			)}
		</HStack>
	);
}
