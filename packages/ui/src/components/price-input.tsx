import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { Input } from "./input";

/**
 * Format a price in cents to a localized currency string.
 * @param cents - The price in cents
 * @param currency - The currency code (default: "EUR")
 * @param locale - The locale for formatting (default: "de-DE")
 * @returns Formatted price string (e.g., "12,99 €")
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
 * Format a price modifier (can be positive or negative) with appropriate sign.
 * Uses proper typographic minus sign (U+2212) for negative values.
 * @param cents - The price modifier in cents
 * @param currency - The currency code (default: "EUR")
 * @param locale - The locale for formatting (default: "de-DE")
 * @returns Formatted string with sign (e.g., "+2,20 €" or "−2,20 €")
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
	className?: string;
	id?: string;
	name?: string;
}

export function PriceInput({
	value,
	onChange,
	onBlur,
	placeholder = "0,00",
	disabled = false,
	className,
	id,
	name,
}: PriceInputProps) {
	const [localValue, setLocalValue] = useState(() => centsToDisplay(value));
	const lastExternalValue = useRef(value);

	// Sync when external value changes (e.g., form reset)
	// Only update if value actually changed from external source
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
		<div className={cn("relative", className)}>
			<Input
				id={id}
				name={name}
				placeholder={placeholder}
				value={localValue}
				onChange={(e) => setLocalValue(e.target.value)}
				onBlur={handleBlur}
				disabled={disabled}
				inputMode="decimal"
				className="pr-8"
			/>
			<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground text-sm">
				€
			</span>
		</div>
	);
}
