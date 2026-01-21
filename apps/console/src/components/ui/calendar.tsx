import { Box } from "@chakra-ui/react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import "react-day-picker/style.css";

export type CalendarProps = DayPickerProps;

export function Calendar({ ...props }: CalendarProps) {
	return (
		<Box
			p="3"
			css={{
				// Style the react-day-picker with Chakra-compatible tokens
				"& .rdp-root": {
					"--rdp-accent-color": "var(--chakra-colors-red-500)",
					"--rdp-accent-background-color": "var(--chakra-colors-red-500)",
					"--rdp-day_button-width": "32px",
					"--rdp-day_button-height": "32px",
					fontSize: "var(--chakra-font-sizes-sm)",
				},
				"& .rdp-day_button": {
					borderRadius: "var(--chakra-radii-md)",
				},
				"& .rdp-today:not(.rdp-selected) .rdp-day_button": {
					backgroundColor: "var(--chakra-colors-bg-muted)",
				},
				"& .rdp-selected .rdp-day_button": {
					backgroundColor: "var(--chakra-colors-red-500)",
					color: "white",
				},
				"& .rdp-outside .rdp-day_button": {
					opacity: 0.5,
				},
				"& .rdp-chevron": {
					fill: "currentColor",
				},
			}}
		>
			<DayPicker showOutsideDays {...props} />
		</Box>
	);
}
