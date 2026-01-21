/**
 * Urgency indicator badge showing elapsed time with color coding.
 */

import { Badge, Box, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
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

const sizeProps = {
	sm: { textStyle: "xs", px: "1.5", py: "0.5" },
	md: { textStyle: "sm", px: "2", py: "1" },
	lg: { textStyle: "base", px: "3", py: "1.5", fontWeight: "medium" },
};

const levelColors = {
	critical: { bg: "red.100", color: "red.700" },
	warning: { bg: "yellow.100", color: "yellow.700" },
	normal: { bg: "green.100", color: "green.700" },
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
		const textColor = getUrgencyTextColor(level);
		return (
			<Text fontWeight="medium" className={className} color={textColor}>
				{elapsed}
			</Text>
		);
	}

	const sizeStyle = sizeProps[size];
	const colors = levelColors[level];

	return (
		<Badge
			display="inline-flex"
			alignItems="center"
			rounded="md"
			fontFamily="mono"
			{...sizeStyle}
			{...colors}
			className={className}
		>
			<Box w="2" h="2" me="1.5" rounded="full" bg={getUrgencyBgColor(level)} />
			{elapsed}
		</Badge>
	);
}
