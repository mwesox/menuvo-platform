import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

interface StepIndicatorProps {
	current: number;
	total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
	const { t } = useTranslation("onboarding");

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.2 }}
			style={{ marginBottom: "2rem" }}
		>
			<VStack gap="3" align="stretch">
				{/* Step segments - full width */}
				<HStack gap="2" align="center">
					{Array.from({ length: total }, (_, i) => (
						<Box
							key={`step-${i + 1}`}
							h="1.5"
							flex="1"
							rounded="full"
							bg={i + 1 <= current ? "primary" : "border.muted"}
							transition="colors"
						/>
					))}
				</HStack>

				{/* Step text */}
				<Text color="fg.muted" textStyle="sm">
					{t("slides.stepIndicator", { current, total })}
				</Text>
			</VStack>
		</motion.div>
	);
}
