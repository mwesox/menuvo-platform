import { Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TimeInputProps {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	className?: string;
	id?: string;
	name?: string;
}

/**
 * Format raw digits to HH:MM time format.
 * Examples:
 * - "9" → "09:00"
 * - "93" → "09:30"
 * - "930" → "09:30"
 * - "2200" → "22:00"
 * - "1234" → "12:34"
 */
function formatTime(digits: string): string {
	// Pad to 4 digits
	const padded = digits.padEnd(4, "0").slice(0, 4);
	const hours = padded.slice(0, 2);
	const minutes = padded.slice(2, 4);
	return `${hours}:${minutes}`;
}

/**
 * Validate and clamp time values to valid 24-hour format.
 */
function normalizeTime(time: string): string {
	const [hoursStr = "0", minutesStr = "0"] = time.split(":");
	let hours = Number.parseInt(hoursStr, 10);
	let minutes = Number.parseInt(minutesStr, 10);

	// Clamp hours to 0-23
	if (Number.isNaN(hours) || hours < 0) hours = 0;
	if (hours > 23) hours = 23;

	// Clamp minutes to 0-59
	if (Number.isNaN(minutes) || minutes < 0) minutes = 0;
	if (minutes > 59) minutes = 59;

	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * TimeInput - A keyboard-friendly time input component.
 *
 * Features:
 * - Type digits directly without cursor segment issues
 * - Auto-formats to HH:MM on blur
 * - Validates and clamps to valid 24-hour time
 * - Clock icon for visual consistency
 */
export function TimeInput({
	value,
	onChange,
	disabled = false,
	className,
	id,
	name,
}: TimeInputProps) {
	const [localValue, setLocalValue] = useState(value);

	// Sync when external value changes
	useEffect(() => {
		setLocalValue(value);
	}, [value]);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const input = e.target.value;

			// Allow empty, digits, and colon for typing
			if (!/^[\d:]*$/.test(input)) return;

			// Limit length (5 chars max for HH:MM)
			if (input.length > 5) return;

			setLocalValue(input);

			// If it looks like a complete time, notify parent
			if (/^\d{2}:\d{2}$/.test(input)) {
				onChange(normalizeTime(input));
			}
		},
		[onChange],
	);

	const handleBlur = useCallback(() => {
		// Strip non-digits and format
		const digits = localValue.replace(/\D/g, "");

		if (digits.length === 0) {
			// Reset to previous valid value
			setLocalValue(value);
			return;
		}

		const formatted = formatTime(digits);
		const normalized = normalizeTime(formatted);
		setLocalValue(normalized);
		onChange(normalized);
	}, [localValue, value, onChange]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			// Allow navigation keys
			if (
				["Tab", "ArrowLeft", "ArrowRight", "Backspace", "Delete"].includes(
					e.key,
				)
			) {
				return;
			}

			// Allow digits
			if (/^\d$/.test(e.key)) {
				return;
			}

			// Allow colon
			if (e.key === ":") {
				return;
			}

			// Prevent other keys
			e.preventDefault();
		},
		[],
	);

	return (
		<div className={cn("relative", className)}>
			<Input
				id={id}
				name={name}
				type="text"
				inputMode="numeric"
				placeholder="00:00"
				value={localValue}
				onChange={handleChange}
				onBlur={handleBlur}
				onKeyDown={handleKeyDown}
				disabled={disabled}
				className="w-full pe-9"
			/>
			<Clock className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
		</div>
	);
}
