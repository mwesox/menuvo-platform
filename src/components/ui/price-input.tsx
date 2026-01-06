import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { cn } from "@/lib/utils.ts";

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

function formatPrice(cents: number, currency = "EUR"): string {
	return new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency,
	}).format(cents / 100);
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
			<span className="min-w-[70px] text-right text-muted-foreground text-sm tabular-nums">
				{formatPrice(displayCents, currency)}
			</span>
		</div>
	);
}
