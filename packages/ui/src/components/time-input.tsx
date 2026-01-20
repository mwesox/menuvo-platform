import { cn } from "../lib/utils";
import { Input } from "./input";

interface TimeInputProps {
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	className?: string;
	id?: string;
	name?: string;
}

/**
 * TimeInput - Native time input for touch-friendly UX.
 *
 * Uses native <input type="time"> which shows:
 * - iOS/iPadOS: Wheel picker (scroll drums)
 * - Android: Native time picker dialog
 * - Desktop: Browser-specific picker
 */
export function TimeInput({
	value,
	onChange,
	disabled = false,
	className,
	id,
	name,
}: TimeInputProps) {
	return (
		<Input
			id={id}
			name={name}
			type="time"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			disabled={disabled}
			className={cn("w-full", className)}
		/>
	);
}
