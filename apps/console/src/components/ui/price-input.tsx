import { Box, Input } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

/**
 * Format a price modifier (can be positive or negative) with appropriate sign.
 * Uses proper typographic minus sign (U+2212) for negative values.
 */
export function formatPriceModifier(
	cents: number,
	currency = "EUR",
	locale = "de-DE",
): string {
	const formatted = formatPrice(Math.abs(cents), currency, locale);

	if (cents > 0) {
		return `+${formatted}`;
	}
	if (cents < 0) {
		return `−${formatted}`; // Using proper minus sign (U+2212)
	}
	return formatted;
}

/**
 * Format a price in cents to a localized currency string.
 */
export function formatPrice(
	cents: number,
	currency = "EUR",
	locale = "de-DE",
): string {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(cents / 100);
}

/**
 * Convert cents to display string (e.g., 1299 -> "12,99")
 */
function centsToDisplay(cents: number): string {
	const euros = cents / 100;
	return euros.toFixed(2).replace(".", ",");
}

/**
 * Parse a display string to cents, accepting both comma and dot as decimal separator
 * Returns null if invalid
 */
function displayToCents(input: string): number | null {
	// Remove any whitespace and the € symbol
	const cleaned = input.replace(/[\s€]/g, "").trim();

	if (!cleaned) {
		return 0;
	}

	// Replace comma with dot for parsing
	const normalized = cleaned.replace(",", ".");

	// Parse as float
	const euros = Number.parseFloat(normalized);

	if (Number.isNaN(euros)) {
		return null;
	}

	// Convert to cents (round to avoid floating point issues)
	return Math.round(euros * 100);
}

interface PriceInputProps {
	value: number;
	onChange: (cents: number) => void;
	onBlur?: () => void;
	placeholder?: string;
	disabled?: boolean;
	id?: string;
	name?: string;
}

export function PriceInput({
	value,
	onChange,
	onBlur,
	placeholder = "0,00",
	disabled = false,
	id,
	name,
}: PriceInputProps) {
	const [localValue, setLocalValue] = useState(() => centsToDisplay(value));
	const lastExternalValue = useRef(value);

	// Sync when external value changes (e.g., form reset)
	useEffect(() => {
		if (value !== lastExternalValue.current) {
			lastExternalValue.current = value;
			setLocalValue(centsToDisplay(value));
		}
	}, [value]);

	const handleBlur = () => {
		const cents = displayToCents(localValue);
		if (cents !== null) {
			// Update the local display to be properly formatted
			setLocalValue(centsToDisplay(cents));
			// Update external value
			lastExternalValue.current = cents;
			onChange(cents);
		} else {
			// Invalid input - revert to last valid value
			setLocalValue(centsToDisplay(value));
		}

		onBlur?.();
	};

	return (
		<Box position="relative">
			<Input
				id={id}
				name={name}
				placeholder={placeholder}
				value={localValue}
				onChange={(e) => setLocalValue(e.target.value)}
				onBlur={handleBlur}
				disabled={disabled}
				inputMode="decimal"
				pr="8"
			/>
			<Box
				position="absolute"
				top="50%"
				right="3"
				transform="translateY(-50%)"
				pointerEvents="none"
				color="fg.muted"
				textStyle="sm"
			>
				€
			</Box>
		</Box>
	);
}
