/**
 * Urgency indicator badge showing elapsed time with color coding.
 */

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useUrgency } from "../hooks/use-urgency";
import { getUrgencyBgColor, getUrgencyTextColor } from "../logic/urgency";

interface UrgencyIndicatorProps {
	/** When the order was confirmed */
	confirmedAt: Date | string | null;
	/** Size variant */
	size?: "sm" | "md" | "lg";
	/** Whether to show as badge or inline text */
	variant?: "badge" | "text";
	/** Additional class names */
	className?: string;
}

const sizeClasses = {
	sm: "text-xs px-1.5 py-0.5",
	md: "text-sm px-2 py-1",
	lg: "text-base px-3 py-1.5 font-medium",
};

export function UrgencyIndicator({
	confirmedAt,
	size = "md",
	variant = "badge",
	className,
}: UrgencyIndicatorProps) {
	const { t } = useTranslation("console-kitchen");
	const { level, timeData } = useUrgency(confirmedAt);

	// Format time using i18n
	const elapsed =
		timeData.type === "none"
			? "—"
			: t(`time.${timeData.type}`, { count: timeData.count });

	if (variant === "text") {
		return (
			<span
				className={cn(getUrgencyTextColor(level), "font-medium", className)}
			>
				{elapsed}
			</span>
		);
	}

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-md font-mono",
				sizeClasses[size],
				level === "critical" &&
					"bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
				level === "warning" &&
					"bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
				level === "normal" &&
					"bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
				className,
			)}
		>
			<span
				className={cn("mr-1.5 size-2 rounded-full", getUrgencyBgColor(level))}
			/>
			{elapsed}
		</span>
	);
}
