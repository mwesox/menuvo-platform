/**
 * Pickup Time Selector Component
 *
 * Displays available pickup time slots from the backend API.
 * Shows slots grouped by day with card-based buttons for better UX.
 */

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@menuvo/ui/components/accordion";
import { cn } from "@menuvo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTRPC } from "../../../lib/trpc";
import {
	ShopCard,
	ShopHeading,
	ShopMutedText,
} from "../../shared/components/ui";

interface PickupTimeSelectorProps {
	storeSlug: string;
	value: string | null;
	onChange: (value: string) => void;
	isRequired?: boolean;
	minDate?: string; // ISO string for minimum date (for pre-orders)
}

interface SlotGroup {
	dayLabel: string;
	dayKey: string;
	datetime: string; // ISO datetime string for formatting
	slots: Array<{
		datetime: string;
		label: string;
		time: string;
	}>;
}

/**
 * Parse slot label to extract day, date, and time information
 * Labels are formatted like: "Today, YYYY-MM-DD, HH:MM", "Tomorrow, YYYY-MM-DD, HH:MM", or "Monday, YYYY-MM-DD, HH:MM"
 */
function parseSlotLabel(label: string): {
	dayLabel: string;
	dayKey: string;
	time: string;
	date: string;
} {
	// Split by comma to separate day, date, and time
	const parts = label.split(",").map((p) => p.trim());

	if (parts.length >= 3) {
		// Format: "Day, Date, Time"
		const dayPart = parts[0]!;
		const datePart = parts[1]!; // Date is the middle part
		const timePart = parts[parts.length - 1]!; // Time is always the last part

		// Check if it's "Today" or "Tomorrow" (case-insensitive, supports English and German)
		const dayLower = dayPart.toLowerCase();
		if (dayLower === "today" || dayLower === "heute") {
			return {
				dayLabel: dayPart,
				dayKey: "today",
				time: timePart,
				date: datePart,
			};
		}
		if (dayLower === "tomorrow" || dayLower === "morgen") {
			return {
				dayLabel: dayPart,
				dayKey: "tomorrow",
				time: timePart,
				date: datePart,
			};
		}

		// Otherwise, it's a day name (e.g., "Monday", "Montag")
		return {
			dayLabel: dayPart,
			dayKey: dayPart.toLowerCase(),
			time: timePart,
			date: datePart,
		};
	}

	if (parts.length === 2) {
		// Fallback for format: "Day, Time" (without date)
		const dayPart = parts[0]!;
		const timePart = parts[1]!;

		const dayLower = dayPart.toLowerCase();
		if (dayLower === "today" || dayLower === "heute") {
			return {
				dayLabel: dayPart,
				dayKey: "today",
				time: timePart,
				date: "",
			};
		}
		if (dayLower === "tomorrow" || dayLower === "morgen") {
			return {
				dayLabel: dayPart,
				dayKey: "tomorrow",
				time: timePart,
				date: "",
			};
		}

		return {
			dayLabel: dayPart,
			dayKey: dayPart.toLowerCase(),
			time: timePart,
			date: "",
		};
	}

	// Fallback: treat entire label as day, no time
	return {
		dayLabel: label,
		dayKey: label.toLowerCase(),
		time: "",
		date: "",
	};
}

/**
 * Map language codes to locale strings for date formatting
 */
function getLocaleForLanguage(languageCode: string): string {
	const lang = languageCode.split("-")[0] || "en";
	switch (lang) {
		case "de":
			return "de-DE";
		case "en":
			return "en-GB";
		default:
			return "en-GB";
	}
}

/**
 * Format date to show only day and month using Intl.DateTimeFormat
 * Returns locale-appropriate format (e.g., "15.01." for German, "01/15" for English)
 */
function formatDateShort(datetimeISO: string, languageCode: string): string {
	if (!datetimeISO) return "";

	try {
		const date = new Date(datetimeISO);
		if (isNaN(date.getTime())) return "";

		const locale = getLocaleForLanguage(languageCode);

		// Format with day and month only
		const formatted = new Intl.DateTimeFormat(locale, {
			day: "2-digit",
			month: "2-digit",
		}).format(date);

		// If the formatted string uses dots as separators (e.g., "15.01"),
		// add a trailing dot to match locale conventions (e.g., "15.01.")
		// This works for any locale that uses dots, not just German
		if (formatted.includes(".")) {
			return `${formatted}.`;
		}

		return formatted;
	} catch {
		return "";
	}
}

/**
 * Group slots by day
 */
function groupSlotsByDay(
	slots: Array<{ datetime: string; label: string }>,
): SlotGroup[] {
	const groups = new Map<string, SlotGroup>();

	for (const slot of slots) {
		const parsed = parseSlotLabel(slot.label);
		const existing = groups.get(parsed.dayKey);

		if (existing) {
			existing.slots.push({
				datetime: slot.datetime,
				label: slot.label,
				time: parsed.time,
			});
		} else {
			groups.set(parsed.dayKey, {
				dayLabel: parsed.dayLabel,
				dayKey: parsed.dayKey,
				datetime: slot.datetime, // Store ISO datetime for formatting
				slots: [
					{
						datetime: slot.datetime,
						label: slot.label,
						time: parsed.time,
					},
				],
			});
		}
	}

	// Sort groups: today -> tomorrow -> other days (alphabetically)
	const sortedGroups: SlotGroup[] = [];
	const today = groups.get("today");
	const tomorrow = groups.get("tomorrow");

	if (today) sortedGroups.push(today);
	if (tomorrow) sortedGroups.push(tomorrow);

	// Add remaining days in order they appear (which should be chronological)
	const otherDays = Array.from(groups.entries())
		.filter(([key]) => key !== "today" && key !== "tomorrow")
		.map(([, group]) => group)
		.sort((a, b) => {
			// Sort by first slot's datetime to maintain chronological order
			const aTime = a.slots[0]?.datetime ?? "";
			const bTime = b.slots[0]?.datetime ?? "";
			return aTime.localeCompare(bTime);
		});

	sortedGroups.push(...otherDays);

	// Sort slots within each group by time
	for (const group of sortedGroups) {
		group.slots.sort((a, b) => a.time.localeCompare(b.time));
	}

	return sortedGroups;
}

export function PickupTimeSelector({
	storeSlug,
	value,
	onChange,
	isRequired = false,
	minDate,
}: PickupTimeSelectorProps) {
	const { t, i18n } = useTranslation("shop");
	const trpc = useTRPC();

	// Get current language code for API
	const languageCode = i18n.language.split("-")[0] || "en";

	// Fetch available pickup slots
	const { data, isLoading, error } = useQuery({
		...trpc.store.status.getAvailablePickupSlots.queryOptions({
			slug: storeSlug,
			languageCode,
		}),
		staleTime: 60_000, // Cache for 1 minute
	});

	// Filter slots based on minDate if provided
	const availableSlots = minDate
		? (data?.slots.filter((slot) => slot.datetime >= minDate) ?? [])
		: (data?.slots ?? []);

	// Group slots by day
	const dayGroups = groupSlotsByDay(availableSlots);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
				<ShopMutedText className="ms-2">
					{t("ordering.loadingSlots")}
				</ShopMutedText>
			</div>
		);
	}

	if (error) {
		return (
			<ShopMutedText className="text-destructive">
				{t("ordering.errorLoadingSlots")}
			</ShopMutedText>
		);
	}

	if (availableSlots.length === 0) {
		return <ShopMutedText>{t("ordering.noSlotsAvailable")}</ShopMutedText>;
	}

	return (
		<div className="space-y-4">
			{isRequired && (
				<ShopMutedText className="text-sm">
					{t("ordering.pickupTimeRequired")}
				</ShopMutedText>
			)}

			<div className="max-h-96 overflow-y-auto">
				<Accordion
					type="multiple"
					defaultValue={dayGroups.length > 0 ? [dayGroups[0]!.dayKey] : []}
					className="space-y-0"
				>
					{dayGroups.map((group) => (
						<AccordionItem key={group.dayKey} value={group.dayKey}>
							<AccordionTrigger className="hover:no-underline">
								<div className="flex items-center gap-2">
									<ShopHeading as="h3" size="sm" className="font-medium">
										{group.dayLabel}
									</ShopHeading>
									{group.datetime && (
										<ShopMutedText className="text-sm">
											{formatDateShort(group.datetime, i18n.language)}
										</ShopMutedText>
									)}
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
									{group.slots.map((slot) => {
										const isSelected = value === slot.datetime;

										return (
											<ShopCard
												key={slot.datetime}
												variant="interactive"
												padding="sm"
												className={cn(
													"cursor-pointer transition-all",
													isSelected
														? "border-2 border-primary bg-primary/10"
														: "border border-border hover:border-primary/50 hover:bg-muted/50",
												)}
												onClick={() => onChange(slot.datetime)}
												onKeyDown={(e) => {
													if (e.key === "Enter" || e.key === " ") {
														e.preventDefault();
														onChange(slot.datetime);
													}
												}}
												role="button"
												tabIndex={0}
												aria-pressed={isSelected}
												aria-label={`${group.dayLabel}, ${slot.time}`}
											>
												<div className="text-center">
													<div
														className={cn(
															"font-medium",
															isSelected ? "text-primary" : "text-foreground",
														)}
													>
														{slot.time}
													</div>
												</div>
											</ShopCard>
										);
									})}
								</div>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</div>
	);
}
