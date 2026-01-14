import { useEffect, useState } from "react";
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

interface PriceInputProps {
	value: number;
	onChange: (cents: number) => void;
	onBlur?: () => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	currency?: string;
	id?: string;
	name?: string;
}

export function PriceInput({
	value,
	onChange,
	onBlur,
	placeholder = "0",
	disabled = false,
	className,
	currency = "EUR",
	id,
	name,
}: PriceInputProps) {
	const [localValue, setLocalValue] = useState(String(value));

	// Sync when external value changes (e.g., form reset)
	useEffect(() => {
		setLocalValue(String(value));
	}, [value]);

	const displayCents = Number.parseInt(localValue, 10) || 0;

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<span className="min-w-[70px] text-muted-foreground text-sm tabular-nums">
				{formatPrice(displayCents, currency)}
			</span>
			<div className="relative flex-1">
				<Input
					id={id}
					name={name}
					placeholder={placeholder}
					value={localValue}
					onChange={(e) => setLocalValue(e.target.value)}
					onBlur={(e) => {
						const parsed = Number.parseInt(e.target.value, 10);
						onChange(Number.isNaN(parsed) ? 0 : parsed);
						onBlur?.();
					}}
					disabled={disabled}
					className="pr-8"
				/>
				<span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground text-sm">
					ct
				</span>
			</div>
		</div>
	);
}
