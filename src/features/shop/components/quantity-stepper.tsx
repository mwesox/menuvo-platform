"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	size?: "sm" | "md";
}

export function QuantityStepper({
	value,
	onChange,
	min = 1,
	max = 99,
	size = "md",
}: QuantityStepperProps) {
	const [animating, setAnimating] = useState(false);

	const isAtMin = value <= min;
	const isAtMax = value >= max;

	const handleChange = (newValue: number) => {
		if (newValue < min || newValue > max) return;

		setAnimating(true);
		onChange(newValue);
		setTimeout(() => setAnimating(false), 150);
	};

	const handleDecrement = () => {
		handleChange(value - 1);
	};

	const handleIncrement = () => {
		handleChange(value + 1);
	};

	const isSm = size === "sm";

	return (
		<div
			className={cn(
				"inline-flex items-center gap-1 rounded-full bg-muted",
				isSm ? "p-0.5" : "p-1",
			)}
		>
			<button
				type="button"
				onClick={handleDecrement}
				disabled={isAtMin}
				aria-label="Decrease quantity"
				className={cn(
					"flex items-center justify-center rounded-full transition-colors",
					"hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
					"active:scale-95",
					isAtMin && "cursor-not-allowed opacity-30 hover:bg-transparent",
					isSm ? "size-8" : "size-10",
				)}
			>
				<Minus className={cn(isSm ? "size-4" : "size-5")} />
			</button>

			<span
				className={cn(
					"min-w-[2rem] text-center font-medium tabular-nums text-foreground",
					"transition-transform duration-150",
					animating && "scale-110",
					isSm ? "text-sm" : "text-base",
				)}
				aria-live="polite"
				aria-atomic="true"
			>
				{value}
			</span>

			<button
				type="button"
				onClick={handleIncrement}
				disabled={isAtMax}
				aria-label="Increase quantity"
				className={cn(
					"flex items-center justify-center rounded-full transition-colors",
					"hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
					"active:scale-95",
					isAtMax && "cursor-not-allowed opacity-30 hover:bg-transparent",
					isSm ? "size-8" : "size-10",
				)}
			>
				<Plus className={cn(isSm ? "size-4" : "size-5")} />
			</button>
		</div>
	);
}
