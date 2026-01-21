import { Box, HStack, IconButton } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuMinus, LuPlus } from "react-icons/lu";

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
	const { t } = useTranslation("shop");
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
		<HStack
			gap="1"
			rounded="xl"
			bg="bg.muted"
			p={isSm ? "0.5" : "1"}
			display="inline-flex"
		>
			<IconButton
				aria-label={t("quantity.decrease")}
				onClick={handleDecrement}
				disabled={isAtMin}
				variant="ghost"
				rounded="full"
				size={isSm ? "sm" : "md"}
				h={isSm ? "8" : "10"}
				w={isSm ? "8" : "10"}
				opacity={isAtMin ? 0.3 : 1}
				cursor={isAtMin ? "not-allowed" : "pointer"}
				_hover={{ bg: isAtMin ? "transparent" : "border" }}
				_active={{ transform: "scale(0.95)" }}
			>
				<LuMinus size={isSm ? 16 : 20} />
			</IconButton>

			<Box
				as="span"
				minW="8"
				textAlign="center"
				fontWeight="medium"
				color="fg"
				fontVariantNumeric="tabular-nums"
				textStyle={isSm ? "sm" : "md"}
				transition="transform 0.15s"
				transform={animating ? "scale(1.1)" : "scale(1)"}
				aria-live="polite"
				aria-atomic="true"
			>
				{value}
			</Box>

			<IconButton
				aria-label={t("quantity.increase")}
				onClick={handleIncrement}
				disabled={isAtMax}
				variant="ghost"
				rounded="full"
				size={isSm ? "sm" : "md"}
				h={isSm ? "8" : "10"}
				w={isSm ? "8" : "10"}
				opacity={isAtMax ? 0.3 : 1}
				cursor={isAtMax ? "not-allowed" : "pointer"}
				_hover={{ bg: isAtMax ? "transparent" : "border" }}
				_active={{ transform: "scale(0.95)" }}
			>
				<LuPlus size={isSm ? 16 : 20} />
			</IconButton>
		</HStack>
	);
}
