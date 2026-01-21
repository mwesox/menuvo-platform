import type { InputProps } from "@chakra-ui/react";
import { Input } from "@chakra-ui/react";

interface TimeInputProps
	extends Omit<InputProps, "type" | "value" | "onChange"> {
	value: string;
	onChange: (value: string) => void;
}

/**
 * TimeInput - Native time input for touch-friendly UX.
 *
 * Uses native <input type="time"> which shows:
 * - iOS/iPadOS: Wheel picker (scroll drums)
 * - Android: Native time picker dialog
 * - Desktop: Browser-specific picker
 */
export function TimeInput({ value, onChange, ...props }: TimeInputProps) {
	return (
		<Input
			type="time"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			{...props}
		/>
	);
}
