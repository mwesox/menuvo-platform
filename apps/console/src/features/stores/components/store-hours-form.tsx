import type { DayOfWeek, StoreHour } from "@menuvo/db/schema";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Field,
	FieldLabel,
	Switch,
	TimeInput,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	type DayHoursInput,
	daysOfWeek,
} from "@/features/stores/hours-validation.ts";
import {
	storeHoursQueries,
	useSaveStoreHours,
} from "@/features/stores/queries.ts";

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
			result.push({
				dayOfWeek: day.dayOfWeek,
				openTime: day.slots[i].openTime,
				closeTime: day.slots[i].closeTime,
				displayOrder: i,
			});
		}
	}

	return result;
}

export function StoreHoursForm({ storeId }: StoreHoursFormProps) {
	const { t } = useTranslation("settings");
	const { t: tCommon } = useTranslation("common");
	const { data: hours } = useSuspenseQuery(storeHoursQueries.list(storeId));
	const saveMutation = useSaveStoreHours();

	const defaultValues = useMemo(() => transformToWeekHours(hours), [hours]);

	const form = useForm({
		defaultValues: {
			weekHours: defaultValues,
		},
		onSubmit: async ({ value }) => {
			const hoursArray = transformToHoursArray(value.weekHours);
			await saveMutation.mutateAsync({
				storeId,
				hours: hoursArray,
			});
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
			<Card>
				<CardHeader>
					<CardTitle>{t("sections.openingHours")}</CardTitle>
					<CardDescription>{t("descriptions.openingHours")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
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
				</CardContent>
			</Card>

			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting
							? tCommon("states.saving")
							: tCommon("buttons.saveChanges")}
					</Button>
				)}
			</form.Subscribe>
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
			newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: newValue };
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

	return (
		<div className="flex items-start gap-4 border-b py-3 last:border-b-0">
			<Field orientation="horizontal" className="w-28 pt-1.5">
				<Switch
					id={`${day}-toggle`}
					checked={value.isOpen}
					onCheckedChange={handleToggle}
				/>
				<FieldLabel htmlFor={`${day}-toggle`} className="font-medium">
					{tCommon(`days.${day}`)}
				</FieldLabel>
			</Field>

			<div className="flex-1">
				{value.isOpen ? (
					<div className="space-y-2">
						{value.slots.map((slot, slotIndex) => (
							<div
								key={`${slot.openTime}-${slot.closeTime}-${slotIndex}`}
								className="flex items-center gap-2"
							>
								<TimeInput
									value={slot.openTime}
									onChange={(val) =>
										handleSlotChange(slotIndex, "openTime", val)
									}
									className="w-32"
								/>
								<span className="text-muted-foreground">
									{tCommon("labels.to")}
								</span>
								<TimeInput
									value={slot.closeTime}
									onChange={(val) =>
										handleSlotChange(slotIndex, "closeTime", val)
									}
									className="w-32"
								/>
								{value.slots.length > 1 && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => handleRemoveSlot(slotIndex)}
									>
										<Trash2 className="size-4" />
									</Button>
								)}
							</div>
						))}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleAddSlot}
							className="mt-2"
						>
							<Plus className="me-1 size-4" />
							{t("actions.addTimeSlot")}
						</Button>
					</div>
				) : (
					<span className="block pt-1.5 text-muted-foreground text-sm">
						{tCommon("labels.closed")}
					</span>
				)}
			</div>
		</div>
	);
}
